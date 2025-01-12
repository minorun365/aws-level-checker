import { useState } from 'react';
import { ApiService } from '../services/api';
import { Progress } from './ui/progress';

interface ShareButtonProps {
  response: string;
  userEmail: string | undefined;
  langfuseSessionId: string;
  idToken: string;
  onError: (message: string) => void;
}

export function ShareButton({
  response,
  userEmail,
  langfuseSessionId,
  idToken,
  onError
}: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleShare = async () => {
    setIsLoading(true);
    setProgress(0);

    // プログレスバーを95%まで8秒かけて進める
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 1;
      });
    }, 80); // 8秒で95%まで進むように80msごとに1%進める
    try {
      const data = await ApiService.generateTweet(
        {
          evalResult: response,
          userEmail,
          langfuseSessionId
        },
        idToken
      );
      const tweetText = encodeURIComponent(data.message);
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
    } catch (error) {
      console.error('ツイート生成エラー:', error);
      onError('ツイート生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setProgress(100);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1">
      {isLoading && (
        <Progress value={progress} className="mb-4" />
      )}
      <a
        onClick={handleShare}
        className={`block mt-4 ${
        isLoading 
          ? 'bg-zinc-700 cursor-not-allowed'
          : 'bg-zinc-900 hover:bg-zinc-800 cursor-pointer'
      } text-white font-medium flex items-center justify-center gap-2 py-2.5 rounded-lg border border-zinc-700 transition-all duration-200 shadow-sm`}
    >
      {isLoading ? "️⌛️ ポストを生成中…" : "Xでポストする"}
      </a>
    </div>
  );
}
