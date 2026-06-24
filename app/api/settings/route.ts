import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const settings = db.getSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const current = db.getSettings();

    const updatedSettings = {
      deliveryFee: typeof body.deliveryFee === 'number' ? body.deliveryFee : current.deliveryFee,
      telegramBotToken: body.telegramBotToken !== undefined ? body.telegramBotToken : current.telegramBotToken,
      telegramChannelId: body.telegramChannelId !== undefined ? body.telegramChannelId : current.telegramChannelId,
      abaQrText: body.abaQrText !== undefined ? body.abaQrText : current.abaQrText,
      abaHolder: body.abaHolder !== undefined ? body.abaHolder : current.abaHolder,
      abaNumber: body.abaNumber !== undefined ? body.abaNumber : current.abaNumber,
      acledaQrText: body.acledaQrText !== undefined ? body.acledaQrText : current.acledaQrText,
      acledaHolder: body.acledaHolder !== undefined ? body.acledaHolder : current.acledaHolder,
      acledaNumber: body.acledaNumber !== undefined ? body.acledaNumber : current.acledaNumber,
      wingQrText: body.wingQrText !== undefined ? body.wingQrText : current.wingQrText,
      wingHolder: body.wingHolder !== undefined ? body.wingHolder : current.wingHolder,
      wingNumber: body.wingNumber !== undefined ? body.wingNumber : current.wingNumber,
      khmerDefaultEnabled: body.khmerDefaultEnabled !== undefined ? !!body.khmerDefaultEnabled : current.khmerDefaultEnabled,
      invoicePrintWidth: body.invoicePrintWidth !== undefined ? body.invoicePrintWidth : current.invoicePrintWidth,
      invoiceHeaderNote: body.invoiceHeaderNote !== undefined ? body.invoiceHeaderNote : current.invoiceHeaderNote,
      invoiceFooterNote: body.invoiceFooterNote !== undefined ? body.invoiceFooterNote : current.invoiceFooterNote,
      deliveryPayMode: body.deliveryPayMode !== undefined ? body.deliveryPayMode : current.deliveryPayMode,
      tgOrderAcceptedTemplate: body.tgOrderAcceptedTemplate !== undefined ? body.tgOrderAcceptedTemplate : current.tgOrderAcceptedTemplate,
      tgOrderDelayedTemplate: body.tgOrderDelayedTemplate !== undefined ? body.tgOrderDelayedTemplate : current.tgOrderDelayedTemplate,
      tgOrderRejectedTemplate: body.tgOrderRejectedTemplate !== undefined ? body.tgOrderRejectedTemplate : current.tgOrderRejectedTemplate,
      tgPaymentUploadedTemplate: body.tgPaymentUploadedTemplate !== undefined ? body.tgPaymentUploadedTemplate : current.tgPaymentUploadedTemplate,
      tgPaymentVerifiedTemplate: body.tgPaymentVerifiedTemplate !== undefined ? body.tgPaymentVerifiedTemplate : current.tgPaymentVerifiedTemplate,
      tgPaymentDeclinedTemplate: body.tgPaymentDeclinedTemplate !== undefined ? body.tgPaymentDeclinedTemplate : current.tgPaymentDeclinedTemplate,
      tgOrderCompletedTemplate: body.tgOrderCompletedTemplate !== undefined ? body.tgOrderCompletedTemplate : current.tgOrderCompletedTemplate,
      tgCustomAcceptedTemplate: body.tgCustomAcceptedTemplate !== undefined ? body.tgCustomAcceptedTemplate : current.tgCustomAcceptedTemplate,
      tgCustomRejectedTemplate: body.tgCustomRejectedTemplate !== undefined ? body.tgCustomRejectedTemplate : current.tgCustomRejectedTemplate,
    };

    db.updateSettings(updatedSettings);
    return NextResponse.json(updatedSettings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
