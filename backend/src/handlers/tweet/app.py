import json
import os
import requests
from typing import Dict, Any, Optional, TypedDict, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_aws import ChatBedrockConverse
from langfuse import Langfuse
from langfuse.callback import CallbackHandler

# カスタム例外クラス
class EnvironmentError(Exception):
    """環境変数関連のエラー"""
    pass

class SecretError(Exception):
    """シークレット取得関連のエラー"""
    pass

class LangfuseError(Exception):
    """Langfuse関連のエラー"""
    pass

class TweetGenerationError(Exception):
    """ツイート生成関連のエラー"""
    pass

# 型定義
class SecretConfig(TypedDict):
    """シークレット設定の型定義"""
    LANGFUSE_SECRET_KEY: str
    LANGFUSE_PUBLIC_KEY: str

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

class LangfuseConfig:
    """Langfuse関連の設定定数"""
    PROMPT_NAME = "tweet_generation"
    RUN_NAME = "Tweet Generation"
    REQUIRED_KEYS = ["LANGFUSE_SECRET_KEY", "LANGFUSE_PUBLIC_KEY"]

class BedrockConfig:
    """Bedrock関連の設定定数"""
    MAX_TOKENS = 4096

# 環境変数定義
REQUIRED_ENV_VARS: List[str] = [
    "LANGFUSE_SECRET_URL",
    "BEDROCK_INFERENCE_PROFILE_ARN",
    "LANGFUSE_HOST",
    "AWS_SESSION_TOKEN"
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
        "headers": {
            "Access-Control-Allow-Origin": os.environ.get("ALLOWED_ORIGIN", "https://dev-checker.minoruonda.com"),
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept,Referer",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps(message)
    }

def get_secrets() -> SecretConfig:
    """
    AWS Secrets Managerから設定を取得する
    
    Returns:
        SecretConfig: シークレット設定
    
    Raises:
        SecretError: シークレット取得に失敗した場合
    """
    try:
        headers = {"X-Aws-Parameters-Secrets-Token": os.environ.get('AWS_SESSION_TOKEN')}
        secrets_extension_endpoint = os.environ["LANGFUSE_SECRET_URL"]
        secrets_response = requests.get(secrets_extension_endpoint, headers=headers)
        
        if secrets_response.status_code != HttpStatus.OK:
            raise SecretError(f"シークレット取得APIが失敗しました。: {secrets_response.status_code} （再実行してみてください🙏）")
            
        secret = json.loads(secrets_response.text)["SecretString"]
        
        if isinstance(secret, str):
            secret = json.loads(secret)
            
        if not all(key in secret for key in LangfuseConfig.REQUIRED_KEYS):
            raise SecretError("必要なシークレットキーが見つかりません")
            
        return secret
    except requests.RequestException as e:
        raise SecretError(f"シークレット取得時にネットワークエラーが発生しました: {str(e)}")
    except json.JSONDecodeError as e:
        raise SecretError(f"シークレットのJSONパースに失敗しました: {str(e)}")
    except SecretError:
        raise
    except Exception as e:
        raise SecretError(f"シークレットの取得に失敗しました: {str(e)}")

def setup_langfuse(
    secret: SecretConfig,
    user_email: Optional[str],
    langfuse_session_id: Optional[str]
) -> tuple[CallbackHandler, Langfuse]:
    """
    Langfuseの設定をセットアップする
    
    Args:
        secret (SecretConfig): シークレット設定
        user_email (Optional[str]): ユーザーメールアドレス
        langfuse_session_id (Optional[str]): セッションID
    
    Returns:
        tuple[CallbackHandler, Langfuse]: LangfuseハンドラーとLangfuseインスタンスのタプル
    
    Raises:
        LangfuseError: Langfuseの設定に失敗した場合
    """
    try:
        # Langfuseインスタンスを認証情報付きで初期化
        langfuse = Langfuse(
            public_key=secret["LANGFUSE_PUBLIC_KEY"],
            secret_key=secret["LANGFUSE_SECRET_KEY"],
            host=os.environ["LANGFUSE_HOST"]
        )
        langfuse_handler = CallbackHandler(
            secret_key=secret["LANGFUSE_SECRET_KEY"],
            public_key=secret["LANGFUSE_PUBLIC_KEY"],
            host=os.environ["LANGFUSE_HOST"],
            user_id=user_email,
            session_id=langfuse_session_id
        )
        return langfuse_handler, langfuse
    except Exception as e:
        raise LangfuseError(f"Langfuseの設定に失敗しました: {str(e)}")

def generate_tweet(
    langfuse: Langfuse,
    eval_result: str,
    langfuse_handler: CallbackHandler
) -> str:
    """
    評価結果からツイート文言を生成する
    
    Args:
        langfuse (Langfuse): Langfuseインスタンス
        eval_result (str): 評価結果
        langfuse_handler (CallbackHandler): Langfuseハンドラー
    
    Returns:
        str: 生成されたツイート文言
    
    Raises:
        TweetGenerationError: ツイート生成に失敗した場合
    """
    try:
        llm = ChatBedrockConverse(
            model=os.environ["BEDROCK_INFERENCE_PROFILE_ARN"],
            max_tokens=BedrockConfig.MAX_TOKENS,
        )
        
        prompt_template = langfuse.get_prompt(LangfuseConfig.PROMPT_NAME)
        prompt = ChatPromptTemplate.from_template(
            prompt_template.get_langchain_prompt(),
            metadata={"langfuse_prompt": prompt_template},
        )

        chain = prompt | llm | StrOutputParser()
        return chain.invoke(
            input={"eval_result": eval_result},
            config={
                "run_name": LangfuseConfig.RUN_NAME,
                "callbacks": [langfuse_handler]
            }
        )
    except Exception as e:
        raise TweetGenerationError(f"ツイート生成に失敗しました: {str(e)}")

def lambda_handler(event: Dict[str, Any], context: Any) -> LambdaResponse:
    """
    Lambda関数のメインハンドラー
    
    Args:
        event (Dict[str, Any]): Lambda関数のイベント
        context (Any): Lambda関数のコンテキスト
    
    Returns:
        LambdaResponse: Lambda関数のレスポンス
    """
    # OPTIONSメソッドの場合は早期リターン
    if event.get("httpMethod") == "OPTIONS":
        return create_response(HttpStatus.OK, {"message": "OK"})

    try:
        # 環境変数の検証
        validate_environment()
        
        # 入力チェック
        body = json.loads(event.get("body", "{}"))
        eval_result = body.get("evalResult")
        if not eval_result:
            return create_response(HttpStatus.BAD_REQUEST, {
                "message": "アウトプットの内容が入力されていないようです🤔"
            })

        # シークレット取得
        secret = get_secrets()
        
        # Langfuseセットアップ
        langfuse_handler, langfuse = setup_langfuse(
            secret,
            event.get("userEmail"),
            event.get("langfuseSessionId")
        )
        
        # ツイート生成
        output = generate_tweet(langfuse, eval_result, langfuse_handler)
        langfuse_handler.flush()
        
        return create_response(HttpStatus.OK, {
            "message": output
        })

    except (EnvironmentError, SecretError, LangfuseError, TweetGenerationError) as e:
        error_message = str(e)
        return create_response(HttpStatus.SERVER_ERROR, {
            "message": f"エラーが発生しました: {error_message}"
        })
    except Exception as e:
        return create_response(HttpStatus.SERVER_ERROR, {
            "message": f"予期せぬエラーが発生しました: {str(e)}"
        })
