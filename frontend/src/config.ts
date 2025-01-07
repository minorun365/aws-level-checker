interface Config {
    apiEndpoint: string;
    tweetApiEndpoint: string;
    cognitoDomain: string;
    cognitoClientId: string;
    logoutUri: string;
    langfusePublicKey: string;
}

export const config: Config = {
    apiEndpoint: import.meta.env.VITE_API_ENDPOINT || '',
    tweetApiEndpoint: import.meta.env.VITE_TWEET_API_ENDPOINT || '',
    cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN || '',
    cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    logoutUri: import.meta.env.VITE_COGNITO_LOGOUT_URI || '',
    langfusePublicKey: import.meta.env.VITE_LANGFUSE_PUBLIC_KEY || '',
};