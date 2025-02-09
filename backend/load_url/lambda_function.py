import json
import os
import requests
from bs4 import BeautifulSoup

def lambda_handler(event, context):
    try:
        # リクエストボディからURLを取得
        body = json.loads(event.get('body', '{}'))
        url = body.get('url')
        
        if not url:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'URLが必要です'})
            }
        
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
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({
                'message': text
            })
        }
        
    except requests.RequestException as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'message': f'URLの取得に失敗しました: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': str(e)})
        }
