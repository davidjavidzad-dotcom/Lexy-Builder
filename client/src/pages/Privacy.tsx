export function Privacy() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold">Privacy</h1>
      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <p>
          GoodLegal collects information you choose to submit through Lexy, including contact details, legal issue details, uploaded file metadata, and workflow answers.
          We use that information to operate the product, review intakes, contact you, and help identify relevant legal help.
        </p>
        <p>
          We store application data with service providers such as our hosting and database providers. We do not sell submitted Lexy intake data.
        </p>
        <p>
          Because GoodLegal is still developing, please avoid submitting highly sensitive information unless it is necessary for your request.
          If you want information deleted, contact GoodLegal and we will handle the request as the product matures.
        </p>
        <p>
          This policy will be expanded as GoodLegal adds accounts, payments, document storage, and lawyer referral features.
        </p>
      </div>
    </div>
  );
}
