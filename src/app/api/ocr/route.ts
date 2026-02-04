import { NextRequest, NextResponse } from 'next/server';
import { extractPatientDataFromImage, extractPatientDataFromPdf, DocumentType } from '@/lib/ocr/extractPatientData';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const documentType = formData.get('documentType') as DocumentType;
    const skipValidation = formData.get('skipValidation') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!documentType || !['registration', 'labResult', 'followup'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Valid document type is required' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    let result;

    // Check if PDF
    if (file.type === 'application/pdf') {
      result = await extractPatientDataFromPdf(base64, documentType, skipValidation);
    } else {
      // Determine image media type
      let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
      if (file.type === 'image/png') {
        mediaType = 'image/png';
      } else if (file.type === 'image/webp') {
        mediaType = 'image/webp';
      } else if (file.type === 'image/gif') {
        mediaType = 'image/gif';
      }

      result = await extractPatientDataFromImage(base64, documentType, mediaType, skipValidation);
    }

    return NextResponse.json({
      success: true,
      validation: result.validation,
      data: result.data,
    });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: 'Failed to process file', details: String(error) },
      { status: 500 }
    );
  }
}
