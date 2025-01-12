import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Textarea } from "./components/ui/textarea"
import { Progress } from "./components/ui/progress"
import { FeedbackButtons } from "./components/FeedbackButtons"
import { ShareButton } from "./components/ShareButton"
import { ApiService } from "./services/api"
import { useCustomAuth } from "./hooks/useAuth"
import { useState } from 'react';

function App() {
  const [blogContent, setBlogContent] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [traceId, setTraceId] = useState('');
  const [langfuseSessionId, setLangfuseSessionId] = useState<string>('');

  const auth = useCustomAuth();

  const invokeBedrock = async () => {
    setIsLoading(true);
    setProgress(0);
    setError('');

    // プログレスバーを95%まで12秒かけて進める
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 1;
      });
    }, 120); // 12秒で95%まで進むように120msごとに1%進める
  
    try {
      const data = await ApiService.checkContent(
        {
          blogContent,
          userEmail: auth.user?.profile?.email
        },
        auth.user?.id_token || ''
      );
      
      setResponse(data.message);
      setTraceId(data.traceId);
      setLangfuseSessionId(data.langfuseSessionId);
    } catch (error) {
      setError('エラーが発生しました。ページを再読み込みして、もう一度お試しください。');
    } finally {
      setProgress(100);
      setIsLoading(false);
    }
  };

  const renderAuthLoading = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              # AWSレベル判定くん
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-white">
            ⌛️ 認証中です…
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="max-w-4xl mx-auto mt-4 text-gray-400 text-sm">
        このアプリは <a href="https://x.com/minorun365" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">みのるん</a> が開発しています。（最後のデプロイ：{__DEPLOY_TIME__}）
      </div>
    </div>
  );

  const renderAuthError = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 text-white">
      <p>おや、認証失敗したようです🤔</p>
      <p>{auth.error?.message}</p>
      <Button
        onClick={auth.resetAuth}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
      >
        もっかいサインインしてみる
      </Button>
    </div>
  );
  
  const renderAuthenticatedContent = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-white text-right">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              auth.signOut();
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
              あなたのアウトプットを以下に貼り付けてください。賢いAIがレベルを分析します。
            </p>
            <Textarea
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              placeholder={`評価したいブログや登壇資料の内容を、テキスト形式でここにコピペしてね
（URLを入れてもページを読みに行くことはできません）`}
              className="min-h-[200px] bg-gray-700 text-white border-gray-600 placeholder:text-gray-300"
            />

            <div className="w-full">
              <Button
                onClick={invokeBedrock}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "⌛️ 分析中…" : "Amazon Bedrockに判定してもらう！"}
              </Button>
              {isLoading && (
                <Progress value={progress} className="w-full mt-4" />
              )}
            </div>

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
                <div className="p-4 space-y-4">
                  <div className="flex gap-2">
                    <ShareButton
                      response={response}
                      userEmail={auth.user?.profile?.email}
                      langfuseSessionId={langfuseSessionId}
                      idToken={auth.user?.id_token || ''}
                      onError={setError}
                    />
                    <FeedbackButtons traceId={traceId} />
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
        このアプリは <a href="https://x.com/minorun365" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">みのるん</a> が開発しています。（最後のデプロイ：{__DEPLOY_TIME__}）
      </div>
    </div>
  );

  const renderUnauthenticatedContent = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              # AWSレベル判定くん
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-white">
              あなたの技術アウトプットのAWSレベルを判定します。
            </p>
            <Button
              onClick={auth.signIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              サインインしてはじめよう！
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="max-w-4xl mx-auto mt-4 text-gray-400 text-sm">
        このアプリは <a href="https://x.com/minorun365" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">みのるん</a> が開発しています。（最後のデプロイ：{__DEPLOY_TIME__}）
      </div>
    </div>
  );

  if (auth.isLoading) {
    return renderAuthLoading();
  }

  if (auth.error) {
    return renderAuthError();
  }

  return auth.isAuthenticated
    ? renderAuthenticatedContent()
    : renderUnauthenticatedContent();
}

export default App;
