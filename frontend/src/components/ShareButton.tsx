import { useState } from 'react';
import { ApiService } from '../services/api';

interface ShareButtonProps {
  response: string;
  userEmail: string | undefined;
  langfuseSessionId: string;
  idToken: string;
  onError: (message: string) => void;
  onLoadingStart: () => void;
  onLoadingEnd: () => void;
}

export function ShareButton({
  response,
  userEmail,
  langfuseSessionId,
  idToken,
  onError,
  onLoadingStart,
  onLoadingEnd
}: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    onLoadingStart();
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
      onLoadingEnd();
      setIsLoading(false);
    }
  };

  return (
    <a
      onClick={handleShare}
      className={`block w-full ${
      isLoading 
        ? 'bg-zinc-700 cursor-not-allowed'
        : 'bg-zinc-900 hover:bg-zinc-800 cursor-pointer'
    } text-white font-medium text-center py-2.5 rounded-lg border border-zinc-700 transition-all duration-200 shadow-sm`}
    >
      {isLoading ? "️⌛️ ポストを生成中…" : "Xでポストする"}
    </a>
  );
}
