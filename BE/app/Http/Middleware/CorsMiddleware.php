<?php

// FILE: app/Http/Middleware/CorsMiddleware.php
// Middleware xử lý CORS thủ công cho Laravel 12
// Tự thêm các header cần thiết vào mọi response API

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Xử lý preflight request (OPTIONS) — trình duyệt gửi trước khi gửi request thật
        // Phải trả về 200 với đúng header thì trình duyệt mới cho gửi tiếp
        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Origin',  'http://localhost:5173')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        $response = $next($request);

        // Gắn CORS header vào mọi response API
        $response->headers->set('Access-Control-Allow-Origin',      'http://localhost:5173');
        $response->headers->set('Access-Control-Allow-Methods',     'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers',     'Content-Type, Authorization, Accept');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
}