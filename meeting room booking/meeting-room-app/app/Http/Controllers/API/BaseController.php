<?php

namespace App\Http\Controllers\API;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class BaseController extends Controller
{
    public function success($result, $message, $code = 200)
    {
        $respone = [
            'code' => $code,
            'success' => true,
            'data' => $result,
            'message' => $message
        ];
        return response()->json($respone, $code);
    }
    public function error($error, $errorMessage = [], $code = 500)
    {
        $respone = [
            'code' => $code,
            'success' => false,
            'message' => $error
        ];
        if (!empty($errorMessage)) {
            $respone['error'] = $errorMessage;
        }
        return response()->json($respone, $code);
    }
}
