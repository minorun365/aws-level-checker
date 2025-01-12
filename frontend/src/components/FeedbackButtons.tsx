import { useState } from 'react';
import { Button } from "./ui/button";
import { LangfuseWeb } from "langfuse";
import { config } from '../config';

interface FeedbackButtonsProps {
  traceId: string;
}

export function FeedbackButtons({ traceId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<0 | 1 | null>(null);

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

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleFeedback(1)}
        disabled={feedback !== null}
        className={`${
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
        className={`${
          feedback === null 
            ? 'bg-gray-500 hover:bg-gray-600' 
            : 'bg-gray-800 cursor-not-allowed'
        }`}
      >
        {feedback === 0 ? '✅' : '👎'}
      </Button>
    </div>
  );
}
