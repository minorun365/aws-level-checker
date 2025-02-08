import json
import os
import base64
import uuid
from typing import Dict, Any, TypedDict
import boto3
from langchain_community.document_loaders import PyPDFLoader
from tempfile import NamedTemporaryFile

# カスタム例外クラス
class EnvironmentError(Exception):
    """環境変数関連のエラー"""
    pass

class S3Error(Exception):
    """S3操作関連のエラー"""
    pass

class PDFProcessError(Exception):
    """PDF処理関連のエラー"""
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

# 必要な環境変数のリスト
REQUIRED_ENV_VARS = [
    "S3_BUCKET_NAME"
]

def validate_environment() -> None:
    """
    必要な環境変数が設定されているか確認する
    
    Raises:
        EnvironmentError: 必要な環境変数が設定されていない場合
    """
    missing_vars = [var for var in REQUIRED_ENV_VARS if not os.environ.get(var)]
    if missing_vars:
        raise EnvironmentError(f"必要な環境変数が設定されていません: {', '.join(missing_vars)}")

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
        "body": json.dumps(message)
    }

def save_to_s3(pdf_content: bytes, file_name: str) -> str:
    """
    PDFファイルをS3に保存する
    
    Args:
        pdf_content (bytes): PDFファイルのバイナリデータ
        file_name (str): 保存するファイル名
    
    Returns:
        str: S3に保存されたオブジェクトのキー
    
    Raises:
        S3Error: S3への保存に失敗した場合
    """
    try:
        s3 = boto3.client('s3')
        bucket_name = os.environ["S3_BUCKET_NAME"]
        object_key = f"uploads/{file_name}"
        
        s3.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=pdf_content
        )
        
        return object_key
    except Exception as e:
        raise S3Error(f"PDFファイルのS3保存に失敗しました: {str(e)}")

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    PDFからテキストを抽出する
    
    Args:
        pdf_content (bytes): PDFファイルのバイナリデータ
    
    Returns:
        str: 抽出されたテキスト
    
    Raises:
        PDFProcessError: PDFの処理に失敗した場合
    """
    try:
        # 一時ファイルにPDFを保存
        with NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_file.write(pdf_content)
            temp_file_path = temp_file.name

        try:
            # PDFからテキストを抽出
            loader = PyPDFLoader(temp_file_path)
            pages = loader.load()
            
            # 全ページのテキストを結合
            text = "\n".join([page.page_content for page in pages])
            
            return text
        finally:
            # 一時ファイルを削除
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise PDFProcessError(f"PDFからのテキスト抽出に失敗しました: {str(e)}")

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
        # 環境変数の検証
        validate_environment()
        
        # 入力チェック
        pdf_base64 = event.get("pdfBase64")
        if not pdf_base64:
            return create_response(HttpStatus.BAD_REQUEST, {
                "message": "PDFファイルが入力されていないようです🤔"
            })
            
        # Base64デコード
        try:
            pdf_content = base64.b64decode(pdf_base64)
        except Exception as e:
            return create_response(HttpStatus.BAD_REQUEST, {
                "message": f"PDFファイルのデコードに失敗しました: {str(e)}"
            })
        
        # ファイル名生成（UUID）
        file_name = f"{uuid.uuid4()}.pdf"
        
        # S3に保存
        object_key = save_to_s3(pdf_content, file_name)
        
        # テキスト抽出
        extracted_text = extract_text_from_pdf(pdf_content)
        
        return create_response(HttpStatus.OK, {
            "message": "PDFの処理が完了しました",
            "text": extracted_text,
            "objectKey": object_key
        })

    except (EnvironmentError, S3Error, PDFProcessError) as e:
        error_message = str(e)
        return create_response(HttpStatus.SERVER_ERROR, {
            "message": f"エラーが発生しました: {error_message}"
        })
    except Exception as e:
        return create_response(HttpStatus.SERVER_ERROR, {
            "message": f"予期せぬエラーが発生しました: {str(e)}"
        })
