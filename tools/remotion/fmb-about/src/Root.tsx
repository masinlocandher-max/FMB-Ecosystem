import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const palette = {
  ink: '#05020a',
  violet: '#3B0A5D',
  bright: '#7A3FE4',
  soft: '#C792FF',
  pale: '#EBD7FF',
  white: '#F5F5FA',
};

type FilmProps = {portraitMode?: boolean};

const Ambient = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [-80, 110], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 72% 38%, ${palette.bright}55, transparent 28%), radial-gradient(circle at 25% 18%, ${palette.violet}cc, transparent 36%), linear-gradient(125deg, ${palette.ink}, #12031b 55%, ${palette.ink})`,
        overflow: 'hidden',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 2,
            height: '150%',
            left: `${54 + i * 14}%`,
            top: -250,
            background: `linear-gradient(transparent,${palette.soft}${i === 0 ? 'cc' : '66'},transparent)`,
            filter: 'drop-shadow(0 0 16px rgba(122,63,228,.85))',
            rotate: '30deg',
            translate: `${drift * (i + 1) * 0.2}px 0px`,
            opacity: 0.7 - i * 0.18,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: '12%',
          border: `1px solid ${palette.pale}20`,
          borderRadius: '50%',
          scale: interpolate(frame, [0, durationInFrames], [0.88, 1.08]),
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '22%',
          border: `1px dashed ${palette.pale}16`,
          borderRadius: '50%',
          rotate: interpolate(frame, [0, durationInFrames], ['0deg', '22deg']),
        }}
      />
    </AbsoluteFill>
  );
};

const Fade = ({
  children,
  from = 0,
  to = 30,
  style = {},
}: {
  children: React.ReactNode;
  from?: number;
  to?: number;
  style?: React.CSSProperties;
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        ...style,
        opacity: interpolate(frame, [from, to], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: `0 ${interpolate(frame, [from, to], [38, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })}px`,
      }}
    >
      {children}
    </div>
  );
};

const Portrait = ({src, portraitMode, branded = false}: {src: string; portraitMode: boolean; branded?: boolean}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width: portraitMode ? 760 : 620,
        aspectRatio: '4 / 5',
        overflow: 'hidden',
        border: `1px solid ${palette.pale}55`,
        boxShadow: '0 40px 100px rgba(0,0,0,.45), 0 0 70px rgba(122,63,228,.28)',
        background: '#160721',
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(frame, [0, 90], [1.03, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          objectPosition: branded ? 'center center' : 'center 20%',
        }}
      />
    </div>
  );
};

const LocationPair = ({portraitMode = false}: {portraitMode?: boolean}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: portraitMode ? '1fr' : '1fr 70px 1fr',
      gap: portraitMode ? 30 : 42,
      alignItems: 'center',
      width: '100%',
      maxWidth: portraitMode ? 760 : 1250,
    }}
  >
    <div>
      <div style={{fontFamily: 'Georgia,serif', fontSize: portraitMode ? 78 : 96, letterSpacing: -5}}>BGC</div>
      <div style={{fontFamily: 'Arial,sans-serif', fontSize: 22, letterSpacing: 5, color: palette.pale}}>TAGUIG CITY · METRO MANILA</div>
    </div>
    <div
      style={{
        height: portraitMode ? 1 : 130,
        width: portraitMode ? '100%' : 1,
        background: `linear-gradient(${portraitMode ? '90deg' : '180deg'},transparent,${palette.soft},transparent)`,
        justifySelf: 'center',
      }}
    />
    <div style={{textAlign: portraitMode ? 'left' : 'right'}}>
      <div style={{fontFamily: 'Georgia,serif', fontSize: portraitMode ? 72 : 90, letterSpacing: -5}}>MASINLOC</div>
      <div style={{fontFamily: 'Arial,sans-serif', fontSize: 22, letterSpacing: 5, color: palette.pale}}>ZAMBALES · PHILIPPINES</div>
    </div>
  </div>
);

const LogoCard = ({src, alt, portraitMode}: {src: string; alt: string; portraitMode: boolean}) => (
  <div
    style={{
      width: portraitMode ? 250 : 340,
      aspectRatio: '1 / 1',
      overflow: 'hidden',
      border: `1px solid ${palette.pale}44`,
      boxShadow: '0 20px 60px rgba(0,0,0,.3)',
    }}
  >
    <Img src={staticFile(src)} alt={alt} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  </div>
);

const Film = ({portraitMode = false}: FilmProps) => {
  const {fps} = useVideoConfig();
  const pad = portraitMode ? 84 : 120;

  return (
    <AbsoluteFill style={{color: palette.white}}>
      <Ambient />

      <Sequence from={0} durationInFrames={3 * fps}>
        <AbsoluteFill
          style={{
            padding: pad,
            display: 'grid',
            gridTemplateColumns: portraitMode ? '1fr' : '1.05fr .7fr',
            alignItems: 'center',
            gap: portraitMode ? 54 : 90,
          }}
        >
          <Fade from={4} to={34}>
            <Img
              src={staticFile('assets/fmb-home-logo.webp')}
              style={{width: portraitMode ? 300 : 390, height: 'auto', marginBottom: 46, filter: `drop-shadow(0 0 24px ${palette.soft}77)`}}
            />
            <h1 style={{fontFamily: 'Georgia,serif', fontSize: portraitMode ? 104 : 142, lineHeight: 0.94, letterSpacing: -7, fontWeight: 400, margin: 0}}>
              Francine Marie<br />Bautista
            </h1>
          </Fade>
          <Fade from={10} to={38} style={{justifySelf: portraitMode ? 'center' : 'end'}}>
            <Portrait src="assets/francine-founder-hero-923.webp" portraitMode={portraitMode} branded />
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={3 * fps} durationInFrames={3 * fps}>
        <AbsoluteFill
          style={{
            padding: pad,
            display: 'grid',
            gridTemplateColumns: portraitMode ? '1fr' : '.7fr 1fr',
            alignItems: 'center',
            gap: portraitMode ? 46 : 100,
          }}
        >
          <Fade from={0} to={24} style={{justifySelf: portraitMode ? 'center' : 'start'}}>
            <Portrait src="assets/francine-home-founder-hd.webp" portraitMode={portraitMode} />
          </Fade>
          <Fade from={8} to={32}>
            <div style={{fontFamily: 'Georgia,serif', fontSize: portraitMode ? 78 : 116, lineHeight: 1.06}}>
              Creative Director.<br />Strategist.<br />Storyteller. Founder.
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={6 * fps} durationInFrames={3 * fps}>
        <AbsoluteFill style={{padding: pad, justifyContent: 'center'}}>
          <Fade from={0} to={24}>
            <div style={{fontFamily: 'Georgia,serif', fontSize: portraitMode ? 72 : 108, lineHeight: 1.02, marginBottom: portraitMode ? 58 : 72}}>
              Distinct identities.<br /><span style={{color: palette.soft}}>One shared direction.</span>
            </div>
            <div style={{display: 'flex', flexDirection: portraitMode ? 'column' : 'row', gap: portraitMode ? 22 : 34, alignItems: portraitMode ? 'center' : 'stretch'}}>
              <LogoCard src="assets/senz-logo-clean.png" alt="SENZ" portraitMode={portraitMode} />
              <LogoCard src="assets/cognita-logo-clean.png" alt="Cognita Institute of AI" portraitMode={portraitMode} />
              <LogoCard src="assets/signature-transparent.png" alt="With Love, FMB" portraitMode={portraitMode} />
            </div>
          </Fade>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={9 * fps} durationInFrames={3 * fps}>
        <AbsoluteFill
          style={{
            padding: pad,
            display: 'grid',
            gridTemplateColumns: portraitMode ? '1fr' : '1fr .62fr',
            alignItems: 'center',
            gap: portraitMode ? 46 : 90,
          }}
        >
          <Fade from={0} to={22}>
            <LocationPair portraitMode={portraitMode} />
            <div style={{fontFamily: 'Georgia,serif', fontSize: portraitMode ? 76 : 116, lineHeight: 1.05, letterSpacing: -5, marginTop: 64}}>
              Rooted in Masinloc.<br /><span style={{color: palette.soft}}>Building from Metro Manila.</span>
            </div>
            <div style={{marginTop: 42, fontFamily: 'Arial,sans-serif', fontSize: 20, letterSpacing: 5}}>FRANCINEMARIEBAUTISTA.COM</div>
          </Fade>
          <Fade from={8} to={30} style={{justifySelf: portraitMode ? 'center' : 'end'}}>
            <Portrait src="assets/francine-founder-front-cutout-900-v1.webp" portraitMode={portraitMode} />
          </Fade>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => (
  <>
    <Composition id="FmbHero" component={Film} durationInFrames={360} fps={30} width={1920} height={1080} defaultProps={{portraitMode: false}} />
    <Composition id="FmbSocial" component={Film} durationInFrames={360} fps={30} width={1080} height={1350} defaultProps={{portraitMode: true}} />
  </>
);
