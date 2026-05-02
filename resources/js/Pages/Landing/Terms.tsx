import Legal from './Legal';

export default function Terms() {
    return (
        <Legal
            title="Terms of Service"
            content={
                <>
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using the Kontrol platform, you agree to be bound by these Terms of Service. If you do not agree to these
                        terms, please do not use the platform.
                    </p>

                    <h2>2. Description of Service</h2>
                    <p>
                        Kontrol provides estate management software solutions including visitor access control, financial collection tracking, and
                        emergency response systems.
                    </p>

                    <h2>3. Resident Responsibilities</h2>
                    <p>
                        Residents are responsible for maintaining the confidentiality of their account credentials and for all activities that occur
                        under their account.
                    </p>

                    <h2>4. Estate Admin Obligations</h2>
                    <p>
                        Estate administrators are responsible for ensuring that all data entered into the platform is accurate and that security
                        protocols are followed according to estate board guidelines.
                    </p>

                    <h2>5. Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate your access to the platform at any time for violation of these terms or for any
                        other reason at our discretion.
                    </p>
                </>
            }
        />
    );
}
