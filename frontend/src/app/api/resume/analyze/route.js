import { NextResponse } from 'next/server';
import { analyzeResume } from '@/lib/groq';
import { parseFile, extractNameFromFilename } from '@/lib/parseFile';
import { uploadResumeBuffer } from '@/lib/cloudinary';
// In Supabase, you could store the session if you wanted, but for this generic route 
// we will just return the analysis data directly to the frontend state
// The frontend AppContext will handle saving to DB state if needed.

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max processing

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file'); // 'file' matches the FormData key in ResumeUpload.jsx
    const jdText = formData.get('jdText') || "General Software Engineering Role"; // Optional JD override

    if (!file) {
      return NextResponse.json(
        { error: 'At least one resume file is required' },
        { status: 400 }
      );
    }

    const name = extractNameFromFilename(file.name);

    // 1. Parse resume text
    const resumeText = await parseFile(file);
    if (!resumeText) {
      throw new Error(`Could not extract text from ${file.name}`);
    }

    // 2. Upload to Cloudinary (non-blocking)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let fileUrl = null;
    try {
      if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
         fileUrl = await uploadResumeBuffer(buffer, file.name);
      }
    } catch (e) {
      console.warn(`Cloudinary upload failed for ${file.name}:`, e);
    }

    // 3. Analyze via Groq
    const analysis = await analyzeResume(jdText, resumeText);

    // 4. Return results (mapped to match our existing Mock Resume object shape)
    return NextResponse.json({
      name,
      fileUrl,
      resumeText,
      score: analysis.score,
      skills: [...analysis.strengths],      // Mapping strength to skills array for UI
      weaknesses: [...analysis.gaps],        // Mapping gap to weaknesses array for UI
      recommendations: [analysis.summary, ...analysis.gaps.map(g => `Address ${g}`)], 
      domain: analysis.recommendation,       // using recommendation as domain (Fit text)
    }, { status: 200 });

  } catch (error) {
    console.error('Screening error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
