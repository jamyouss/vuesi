vcl 4.1;

# import VMOD;
import std;

backend default {
    .host = "app";
    .port = "3000";
}

# This subroutine is called at the begining of the request
sub vcl_recv
{
    # Unset x-cache http header as it will be set by this conf
	unset req.http.x-cache;

    # Pipe for webpack hmr
    if (req.url ~ "/_nuxt/hmr") {
        return (pipe);
    }
    
    # We dont deal with OPTIONS
    if (req.method == "OPTIONS") {
        return(synth(405, "Not allowed."));
    }

    # We only deal with GET and HEAD by default
    if (req.method != "GET" && req.method != "HEAD") {
        return (pass);
    }

    return (hash);
}

# Subroutine called when object is found in cache
sub vcl_hit {
	set req.http.x-cache = "hit";
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

    return (deliver);
}

# This subroutine is called before a cached object is delivered to the client
sub vcl_deliver
{
    # Add varnish header for debug
	set resp.http.x-cache = req.http.x-cache;

    return (deliver);
}