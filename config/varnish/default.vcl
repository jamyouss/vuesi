vcl 4.1;

backend default {
    .host = "app";
    .port = "3000";
    .probe = {
        .url = "/";
        .interval = 5s;
        .timeout = 2s;
        .window = 5;
        .threshold = 3;
    }
}

# This subroutine is called at the beginning of the request
sub vcl_recv
{
    # Unset x-cache http header as it will be set by this conf
    unset req.http.x-cache;

    # Pipe for webpack/vite hmr
    if (req.url ~ "/_nuxt/hmr") {
        return (pipe);
    }

    # Pass OPTIONS through to backend (needed for CORS preflight)
    if (req.method == "OPTIONS") {
        return (pass);
    }

    # We only deal with GET and HEAD by default
    if (req.method != "GET" && req.method != "HEAD") {
        return (pass);
    }

    # Normalize fragment requests for optimal cache hit ratio
    if (req.url ~ "^/api/_fragment") {
        # Extract allowed params
        set req.http.x-vuesi-component = regsub(req.url, ".*[?&]component=([^&]*).*", "\1");
        set req.http.x-vuesi-props = regsub(req.url, ".*[?&]props=([^&]*).*", "\1");

        # Rebuild URL with sorted params (component first, then props)
        if (req.http.x-vuesi-props != req.url) {
            set req.url = "/api/_fragment?component=" + req.http.x-vuesi-component + "&props=" + req.http.x-vuesi-props;
        } else {
            set req.url = "/api/_fragment?component=" + req.http.x-vuesi-component;
        }

        # Clean up temporary headers
        unset req.http.x-vuesi-component;
        unset req.http.x-vuesi-props;

        # Strip all headers that cause cache fragmentation
        unset req.http.cookie;
        unset req.http.accept;
        unset req.http.accept-language;
        unset req.http.accept-encoding;
        unset req.http.authorization;
    }

    return (hash);
}

# Subroutine called when object is found in cache
sub vcl_hit {
    set req.http.x-cache = "hit";

    if (obj.ttl >= 0s) {
        return (deliver);
    }

    # Serve stale content during grace period
    if (obj.ttl + obj.grace > 0s) {
        set req.http.x-cache = "hit-stale";
        return (deliver);
    }

    return (miss);
}

# Subroutine called if a requested object is not found in cache
sub vcl_miss {
    set req.http.x-cache = "miss";
}

# Subroutine called when entering in pass mode
sub vcl_pass {
    set req.http.x-cache = "pass";
}

# Subroutine called when entering in pipe mode
sub vcl_pipe {
    set req.http.x-cache = "pipe";

    if (req.http.upgrade) {
        set bereq.http.upgrade = req.http.upgrade;
        set bereq.http.connection = req.http.connection;
    }
}

# This subroutine is called after the response headers have been successfully retrieved from the backend.
sub vcl_backend_response
{
    if (beresp.http.surrogate-control ~ "ESI/1.0") {
        unset beresp.http.surrogate-control;
        set beresp.do_esi = true;
    }

    # Strip headers that would fragment cache for fragment responses
    if (bereq.url ~ "^/api/_fragment") {
        unset beresp.http.vary;
        unset beresp.http.set-cookie;
    }

    # Allow serving stale content while revalidating
    set beresp.grace = 5m;
    set beresp.keep = 10m;

    return (deliver);
}

# Handle backend errors
sub vcl_backend_error {
    set beresp.http.content-type = "text/html; charset=utf-8";
    synthetic({"<!DOCTYPE html>
<html>
<head><title>Service Unavailable</title></head>
<body>
<h1>503 Service Unavailable</h1>
<p>The backend server is not responding. Please try again later.</p>
</body>
</html>"});
    return (deliver);
}

# This subroutine is called before a cached object is delivered to the client
sub vcl_deliver
{
    # Add varnish header for debug
    set resp.http.x-cache = req.http.x-cache;

    return (deliver);
}
