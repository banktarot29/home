// api/og.js - Open Graph image generator
// Uses Vercel's @vercel/og on Edge Runtime, with a static SVG fallback.

export const config = { runtime: 'edge' };

export default async function handler() {
  try {
    const { ImageResponse } = await import('@vercel/og');

    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'linear-gradient(160deg, #07111d 0%, #0e1c2e 100%)',
            padding: '60px 80px',
            fontFamily: 'serif',
            position: 'relative',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '28px',
                  left: '28px',
                  right: '28px',
                  bottom: '28px',
                  border: '1.5px solid rgba(201,168,76,0.4)',
                  borderRadius: '6px',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '14px',
                  color: 'rgba(201,168,76,0.78)',
                  letterSpacing: '4px',
                  marginBottom: '24px',
                },
                children: 'Sinsa Bank · Feng Shui Check',
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '72px',
                  fontWeight: '700',
                  color: '#ffffff',
                  lineHeight: 1.1,
                  marginBottom: '8px',
                },
                children: 'ตรวจฮวงจุ้ย',
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '72px',
                  fontWeight: '700',
                  color: '#ffffff',
                  lineHeight: 1.1,
                  marginBottom: '20px',
                },
                children: 'หน้าบ้านฟรี',
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  width: '420px',
                  height: '3px',
                  borderRadius: '2px',
                  marginBottom: '32px',
                  background: 'linear-gradient(90deg, #8B6914, #C9A84C, #F0DC9A)',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.68)',
                  lineHeight: 1.6,
                },
                children: 'อัปโหลดภาพหน้าบ้าน · อ่านทางเข้า ประตู รั้ว และแสง · บอกจุดที่ควรเริ่มปรับ',
              },
            },
            {
              type: 'div',
              props: {
                style: { display: 'flex', gap: '12px', marginTop: '36px' },
                children: ['อ่านจากภาพจริง', 'ผลเฉพาะบ้านคุณ', 'ใช้เวลาประมาณ 30-60 วินาที'].map(label => ({
                  type: 'div',
                  props: {
                    style: {
                      padding: '10px 20px',
                      borderRadius: '24px',
                      fontSize: '15px',
                      color: 'rgba(201,168,76,0.92)',
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.3)',
                    },
                    children: label,
                  },
                })),
              },
            },
          ],
        },
      },
      { width: 1200, height: 630 }
    );
  } catch (e) {
    return Response.redirect('/og.svg', 302);
  }
}
