import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

const client = new RecaptchaEnterpriseServiceClient({
    credentials: {
        client_email: process.env.RECAPTCHA_CLIENT_EMAIL,
        private_key: process.env.RECAPTCHA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

/**
  * Create an assessment to analyze the risk of a UI action.
  *
  * projectID: Your Google Cloud Project ID.
  * recaptchaSiteKey: The reCAPTCHA key associated with the site/app
  * token: The generated token obtained from the client.
  * recaptchaAction: Action name corresponding to the token.
  */
export async function createAssessment({
    projectID = process.env.GOOGLE_CLOUD_PROJECT_ID,
    recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    token,
    recaptchaAction,
}: {
    projectID?: string;
    recaptchaKey?: string;
    token: string;
    recaptchaAction: string;
}) {
    if (!projectID || !recaptchaKey || !token) {
        console.error("Missing required reCAPTCHA parameters", { projectID, recaptchaKey, token });
        return null;
    }

    try {
        const projectPath = client.projectPath(projectID);

        // Build the assessment request.
        const request = {
            assessment: {
                event: {
                    token: token,
                    siteKey: recaptchaKey,
                },
            },
            parent: projectPath,
        };

        const [response] = await client.createAssessment(request);

        // Check if the token is valid.
        if (!response.tokenProperties?.valid) {
            console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties?.invalidReason}`);
            return null;
        }

        // Check if the expected action was executed.
        if (response.tokenProperties.action === recaptchaAction) {
            console.log(`The reCAPTCHA score is: ${response.riskAnalysis?.score}`);
            return response.riskAnalysis?.score ?? 0;
        } else {
            console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
            return null;
        }
    } catch (error) {
        console.error("reCAPTCHA Enterprise Assessment Error:", error);
        return null;
    }
}
