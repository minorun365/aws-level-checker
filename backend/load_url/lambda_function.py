import json
import os
import requests
from bs4 import BeautifulSoup
from typing import Dict, Any, TypedDict

# カスタム例外クラス
class URLProcessError(Exception):
    """URL処理関連のエラー"""
    pass

# 型定義
class LambdaResponse(TypedDict):
    """Lambda関数のレスポンス型定義"""
    statusCode: int
    body: str

# 設定定数
class HttpStatus:
    """HTTPステータスコード定数"""
    OK = 200
    BAD_REQUEST = 400
    SERVER_ERROR = 500

def create_response(status_code: int, message: Dict[str, Any]) -> LambdaResponse:
    """
    レスポンスを生成する
    
    Args:
        status_code (int): HTTPステータスコード
        message (Dict[str, Any]): レスポンスメッセージ
    
    Returns:
        LambdaResponse: Lambda関数のレスポンス
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        "body": json.dumps(message)
    }

def extract_text_from_url(url: str) -> str:
    """
    URLからテキストを抽出する
    
    Args:
        url (str): 処理対象のURL
    
    Returns:
        str: 抽出されたテキスト
    
    Raises:
        URLProcessError: URLの処理に失敗した場合
    """
    try:
        # URLからコンテンツを取得
        response = requests.get(url)
        response.raise_for_status()
        
        # HTMLをパースしてテキストを抽出
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # scriptとstyle要素を削除
        for script in soup(["script", "style"]):
            script.decompose()
            
        # テキストコンテンツを取得
        text = soup.get_text()
        
        # 行に分割して前後の空白を削除
        lines = (line.strip() for line in text.splitlines())

        # 複数行の見出しを1行ずつに分割
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))

        # 空行を削除して結合
        return ' '.join(chunk for chunk in chunks if chunk)
            
    except Exception as e:
        raise URLProcessError(f"URLからのテキスト抽出に失敗しました: {str(e)}")

def lambda_handler(event: Dict[str, Any], context: Any) -> LambdaResponse:
    """
    Lambda関数のメインハンドラー
    
    Args:
        event (Dict[str, Any]): Lambda関数のイベント
        context (Any): Lambda関数のコンテキスト
    
    Returns:
        LambdaResponse: Lambda関数のレスポンス
    """
    try:
        # URLを取得
        url = event.get('url')
        if not url:
            return create_response(HttpStatus.BAD_REQUEST, {
                "message": "URLが入力されていないようです🤔"
            })
        
        # テキスト抽出
        extracted_text = extract_text_from_url(url)
        
        return create_response(HttpStatus.OK, {
            "message": extracted_text if extracted_text.strip() else "テキストを抽出できませんでした。URLを確認してください。"
        })

    except URLProcessError as e:
        print("URLProcessError:", str(e))
        return create_response(HttpStatus.BAD_REQUEST, {
            "message": str(e)
        })
    except Exception as e:
        print("Unexpected error:", str(e))
        return create_response(HttpStatus.SERVER_ERROR, {
            "message": f"予期せぬエラーが発生しました: {str(e)}"
        })
