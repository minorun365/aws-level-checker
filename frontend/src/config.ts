interface Config {
    apiEndpoint: string;
    cognitoDomain: string;
    cognitoClientId: string;
    logoutUri: string;
    langfusePublicKey: string;
}

export const config: Config = {
    apiEndpoint: import.meta.env.VITE_API_ENDPOINT || '',
    cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN || '',
    cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    logoutUri: import.meta.env.VITE_SITE_URL || '',
    langfusePublicKey: import.meta.env.VITE_LANGFUSE_PUBLIC_KEY || '',
};
