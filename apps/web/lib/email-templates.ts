export function offerReceivedEmail(sellerName: string, propertyAddress: string, offerAmount: string, buyerName: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
      <h1 style="color: #10b981; margin-bottom: 8px;">New offer received</h1>
      <p style="color: #94a3b8;">Hi ${sellerName},</p>
      <p>You have a new offer on your property at <strong>${propertyAddress}</strong>.</p>
      <div style="background: #1e293b; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">OFFER AMOUNT</p>
        <p style="margin: 8px 0 0; font-size: 32px; font-weight: bold; color: #10b981;">${offerAmount}</p>
        <p style="margin: 16px 0 0; color: #94a3b8; font-size: 14px;">FROM</p>
        <p style="margin: 8px 0 0; font-size: 18px;">${buyerName}</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/sell/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">View offer</a>
      <p style="color: #475569; font-size: 12px; margin-top: 40px;">HomeBase · No agents. No commissions. Just results.</p>
    </div>
  `;
}

export function offerAcceptedEmail(buyerName: string, propertyAddress: string, offerAmount: string, propertyId: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
      <h1 style="color: #10b981; margin-bottom: 8px;">Your offer was accepted! 🎉</h1>
      <p style="color: #94a3b8;">Hi ${buyerName},</p>
      <p>Great news! Your offer on <strong>${propertyAddress}</strong> has been accepted.</p>
      <div style="background: #1e293b; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">ACCEPTED OFFER</p>
        <p style="margin: 8px 0 0; font-size: 32px; font-weight: bold; color: #10b981;">${offerAmount}</p>
      </div>
      <p>Your next step is to select a lender. We've sent your deal to our network — lenders are ready to compete for your business.</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/lenders?propertyId=${propertyId}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Select your lender →</a>
      <p style="color: #475569; font-size: 12px; margin-top: 40px;">HomeBase · No agents. No commissions. Just results.</p>
    </div>
  `;
}

export function offerRejectedEmail(buyerName: string, propertyAddress: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
      <h1 style="color: #f1f5f9; margin-bottom: 8px;">Offer update</h1>
      <p style="color: #94a3b8;">Hi ${buyerName},</p>
      <p>Unfortunately your offer on <strong>${propertyAddress}</strong> was not accepted by the seller.</p>
      <p>Don't give up — there are plenty of great homes on HomeBase. Keep browsing and submit another offer.</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/properties" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Browse homes</a>
      <p style="color: #475569; font-size: 12px; margin-top: 40px;">HomeBase · No agents. No commissions. Just results.</p>
    </div>
  `;
}

export function tourConfirmedEmail(buyerName: string, propertyAddress: string, date: string, time: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
      <h1 style="color: #10b981; margin-bottom: 8px;">Tour confirmed ✓</h1>
      <p style="color: #94a3b8;">Hi ${buyerName},</p>
      <p>Your tour of <strong>${propertyAddress}</strong> has been confirmed.</p>
      <div style="background: #1e293b; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">DATE</p>
        <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold;">${date}</p>
        <p style="margin: 16px 0 0; color: #94a3b8; font-size: 14px;">TIME</p>
        <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold;">${time}</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/showings" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">View my tours</a>
      <p style="color: #475569; font-size: 12px; margin-top: 40px;">HomeBase · No agents. No commissions. Just results.</p>
    </div>
  `;
}

export function lenderSelectedEmail(buyerName: string, propertyAddress: string, lenderName: string, rate: string, monthlyPayment: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 12px;">
      <h1 style="color: #10b981; margin-bottom: 8px;">Lender selected</h1>
      <p style="color: #94a3b8;">Hi ${buyerName},</p>
      <p>You've selected a lender for your purchase of <strong>${propertyAddress}</strong>.</p>
      <div style="background: #1e293b; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">LENDER</p>
        <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold;">${lenderName}</p>
        <p style="margin: 16px 0 0; color: #94a3b8; font-size: 14px;">RATE</p>
        <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold;">${rate}% APR</p>
        <p style="margin: 16px 0 0; color: #94a3b8; font-size: 14px;">EST. MONTHLY PAYMENT</p>
        <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold;">${monthlyPayment}/mo</p>
      </div>
      <p>Your transaction is moving forward. Track every step in your pipeline dashboard.</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">View my transaction</a>
      <p style="color: #475569; font-size: 12px; margin-top: 40px;">HomeBase · No agents. No commissions. Just results.</p>
    </div>
  `;
}
