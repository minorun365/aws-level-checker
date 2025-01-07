import { config } from './config';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Textarea } from "./components/ui/textarea"

import { useState } from 'react';
import { useAuth } from "react-oidc-context";
import { LangfuseWeb } from "langfuse";

function App() {
  const [blogContent, setBlogContent] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [traceId, setTraceId] = useState('');
  const [feedback, setFeedback] = useState<0 | 1 | null>(null);
  const [isPostLoading, setIsPostLoading] = useState(false);
  const [langfuseSessionId, setLangfuseSessionId] = useState<string>('');

  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = config.cognitoClientId;
    const logoutUri = config.logoutUri;
    const cognitoDomain = config.cognitoDomain;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  }; // うまくサインアウトされない

  const invokeBedrock = async () => {
    setIsLoading(true);
    setError('');
    setFeedback(null); // フィードバックをリセット
  
    try {
      const response = await fetch(`${config.apiEndpoint}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user?.id_token}`
        },
        body: JSON.stringify({
          blogContent,
          userEmail: auth.user?.profile?.email
        }),
      });
  
      if (!response.ok) {
        throw new Error('APIエラーが発生しました');
      }
  
      const data = await response.json();
      const bodyData = JSON.parse(data.body);
      setResponse(bodyData.message);
      setTraceId(bodyData.traceId);
      setLangfuseSessionId(bodyData.predefinedSessionId);
    } catch (error) {
      setError('エラーが発生しました。ページを再読み込みして、もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (value: 0 | 1) => {
    setFeedback(value);
    const langfuseWeb = new LangfuseWeb({
      publicKey: config.langfusePublicKey,
      baseUrl: "https://us.cloud.langfuse.com"
    });
    
    await langfuseWeb.score({
      traceId: traceId,
      name: "user_feedback",
      value,
    });
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 text-white">
       認証中です…🏃‍♂️
      </div>
    )
  }
  
  if (auth.error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 text-white">
        <p>おや、認証失敗したようです🤔</p>
        <p>{auth.error.message}</p>
        <Button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
          もっかいサインインしてみる
        </Button>
      </div>
    )
  }
  
  if (auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-white text-right">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                signOutRedirect();
              }}
              className="text-white hover:text-gray-300 cursor-pointer"
            >
              サインアウト
            </a>
          </div>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">
                # AWSレベル判定くん
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-white">
                あなたのアウトプットを以下に貼り付けてください。賢い生成AIがレベルを分析します。
              </p>
              <Textarea
                value={blogContent}
                onChange={(e) => setBlogContent(e.target.value)}
                placeholder={`評価したいブログや登壇資料の内容を、テキスト形式でここにコピペしてね
（URLを入れてもページを読みに行くことはできません）`}
                className="min-h-[200px] bg-gray-700 text-white border-gray-600 placeholder:text-gray-300"
              />

              <Button
                onClick={invokeBedrock}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "分析中⌛️ 10秒ちょい待ってね" : "Amazon Bedrockに判定してもらう！"}
              </Button>

              {error && (
                <p className="text-pink-500">
                  {error}
                </p>
              )}

              {response && (
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="pt-4">
                    {response.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="text-white mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </CardContent>
                  <div className="px-4 pb-4 flex gap-2">
                    <a
                      onClick={async () => {
                        setIsPostLoading(true);
                        try {
                          const generateResponse = await fetch(`${config.tweetApiEndpoint}/check`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${auth.user?.id_token}`
                            },
                            body: JSON.stringify({
                              evalResult: response,
                              userEmail: auth.user?.profile?.email,
                              langfuseSessionId: langfuseSessionId
                            }),
                          });

                          if (!generateResponse.ok) {
                            throw new Error('ツイート生成APIエラーが発生しました');
                          }

                          const data = await generateResponse.json();
                          const bodyData = JSON.parse(data.body);
                          const tweetText = encodeURIComponent(bodyData.message);
                          window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
                        } catch (error) {
                          console.error('ツイート生成エラー:', error);
                          setError('ツイート生成中にエラーが発生しました。もう一度お試しください。');
                        } finally {
                          setIsPostLoading(false);
                        }
                      }}
                      className={`flex-1 mt-4 ${
                        isPostLoading 
                          ? 'bg-zinc-700 cursor-not-allowed'
                          : 'bg-zinc-900 hover:bg-zinc-800 cursor-pointer'
                      } text-white font-medium flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-700 transition-all duration-200 shadow-sm`}
                    >
                      {isPostLoading ? "ポスト文案を生成中⌛️ 10秒ちょい待ってね" : "Xでポストする"}
                    </a>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleFeedback(1)}
                        disabled={feedback !== null}
                        className={`mt-4 ${
                          feedback === null 
                            ? 'bg-gray-500 hover:bg-gray-600' 
                            : 'bg-gray-800 cursor-not-allowed'
                        }`}
                      >
                        {feedback === 1 ? '✅' : '👍'}
                      </Button>
                      <Button
                        onClick={() => handleFeedback(0)}
                        disabled={feedback !== null}
                        className={`mt-4 ${
                          feedback === null 
                            ? 'bg-gray-500 hover:bg-gray-600' 
                            : 'bg-gray-800 cursor-not-allowed'
                        }`}
                      >
                        {feedback === 0 ? '✅' : '👎'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <p className="text-gray-400 text-sm">
                評価基準は以下です。判定結果はあくまで参考程度に活用ください。
              </p>
              <ul className="list-disc pl-4 space-y-1 text-gray-400 text-sm">
                <li>Level 100 : AWS サービスの概要を解説するレベル</li>
                <li>Level 200 : トピックの入門知識を持っていることを前提に、ベストプラクティス、サービス機能を解説するレベル</li>
                <li>Level 300 : 対象のトピックの詳細を解説するレベル</li>
                <li>Level 400 : 複数のサービス、アーキテクチャによる実装でテクノロジーがどのように機能するかを解説するレベル</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="max-w-4xl mx-auto mt-4 text-gray-400 text-sm">
          このアプリは <a href="https://x.com/minorun365" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">みのるん</a> が開発しました。
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <Button
        onClick={() => auth.signinRedirect()}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          サインインしてはじめよう！
      </Button>
    </div>
  )
}

export default App;
