import Legal from './Legal';

export default function Privacy() {
    return (
        <Legal
            title="Privacy Policy"
            content={
                <>
                    <h2>1. Introduction</h2>
                    <p>
                        At Kontrol, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information
                        when you use our estate management platform.
                    </p>

                    <h2>2. Information We Collect</h2>
                    <p>
                        We collect information you provide directly to us, such as when you create an account, register a household, or trigger an SOS
                        alert. This includes your name, email, phone number, and estate address.
                    </p>

                    <h2>3. How We Use Your Information</h2>
                    <p>
                        We use the information we collect to operate, maintain, and provide the features of the platform, including security
                        validation, collection tracking, and emergency response.
                    </p>

                    <h2>4. Data Security</h2>
                    <p>
                        We implement bank-grade security measures to protect your data. This includes SSL encryption, secure server environments, and
                        strict access controls.
                    </p>

                    <h2>5. Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us at privacy@kontrol.test.</p>
                </>
            }
        />
    );
}
