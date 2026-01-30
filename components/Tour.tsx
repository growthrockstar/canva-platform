"use client";

import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useCanvasStore } from '@/lib/store/useCanvasStore';

const Tour: React.FC = () => {
  const { runTour, setRunTour } = useCanvasStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-start tour if it hasn't been seen yet?
    // For now we rely on runTour being set to true by some button or default.
    // Let's assume we want to auto-run on first visit.
    // But since we use persist, we can check if a "hasSeenTour" flag exists.
    // For now, I'll just check `runTour`.
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 text-[var(--color-primary)] font-title uppercase">¡Bienvenido al Growth Canvas!</h2>
          <p className="text-sm">Esta es tu herramienta para diseñar estrategias de crecimiento ganadoras. Déjame mostrarte cómo funciona.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '#tour-project-title',
      content: 'Empieza nombrando tu proyecto aquí. Dale una identidad a tu estrategia.',
    },
    {
      target: '#tour-student-name',
      content: 'Personalízalo con tu nombre o el de tu equipo.',
    },
    {
      target: '#tour-grid-view',
      content: 'Cambia la vista del canvas. Puedes trabajar en 1, 2 o 3 columnas según tu preferencia.',
    },
    {
      target: '#tour-dashboard',
      content: 'Aquí verás el progreso de tu estrategia. Marca las secciones como completadas a medida que avanzas.',
    },
    {
      target: '.tour-add-widgets', // Targets the first instance found
      content: 'Este es el corazón del canvas. Agrega bloques de texto, tablas, gráficos, imágenes o secciones desplegables para documentar tus hipótesis y experimentos.',
    },
    {
      target: '#tour-actions',
      content: 'Finalmente, guarda tu progreso descargando el archivo .gr, carga proyectos anteriores o exporta todo a un PDF profesional para presentar.',
    },
  ];

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunTour(false);
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#FA0145',
          textColor: '#171717',
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
        },
        buttonNext: {
          backgroundColor: '#FA0145',
          color: '#ffffff',
          fontWeight: 'bold',
          fontFamily: 'var(--font-sans)',
        },
        buttonBack: {
          color: '#171717',
          fontFamily: 'var(--font-sans)',
        },
        tooltip: {
            fontFamily: 'var(--font-sans)',
            borderRadius: '8px',
        },
        tooltipContainer: {
            textAlign: 'left'
        },
        tooltipTitle: {
            fontFamily: 'var(--font-title)',
            color: '#FA0145',
            fontSize: '1.1rem',
        }
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar',
      }}
    />
  );
};

export default Tour;
