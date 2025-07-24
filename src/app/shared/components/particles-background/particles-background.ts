import { Component, effect, signal } from '@angular/core';
import { NgxParticlesModule } from '@tsparticles/angular';
import { BackgroundService } from '../../../core/services/background';
import { loadFull } from 'tsparticles';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-particles-background',
  standalone: true,
  imports: [NgxParticlesModule, CommonModule],
  templateUrl: './particles-background.html',
  styleUrl: './particles-background.scss'
})

export class ParticlesBackgroundComponent {
  id = "tsparticles";

  // 1. On transforme particlesOptions en un signal !
  public readonly particlesOptions = signal<any>({});
  public isVisible = signal(true);

  // 2. On injecte le service
  constructor(private backgroundService: BackgroundService) {
    // 3. On utilise un `effect` pour réagir aux changements
    effect(() => {
      const state = this.backgroundService.state();

    // On vérifie si on reçoit bien la mise à jour
    console.log('--- ORDRE REÇU ---', state);

      // On ne reconstruit les options que si le thème est bien "particules"
      if (state.type === 'particles') {
        let newOptions = {};

        // On regarde si un thème spécifique est demandé (ex: 'angry')
        if (state.value === 'angry') {
          // Configuration pour le thème "Angry"
          newOptions = {
            background: { color: { value: '#ffffffff' } },
            fpsLimit: 120,
            particles: {
              color: { value: '#ff0000' },
              move: { enable: true, speed: 6, outModes: { default: "destroy" as const } },
              number: { value: 0 },
              opacity: { value: { min: 0.3, max: 1 } },
              shape: { type: "circle" as const },
              size: { value: { min: 1, max: 3 } },
              life: { duration: { value: 12 }, count: 1 }
            },
            emitters: [{
              position: { x: 50, y: 55 },
              rate: { quantity: 15, delay: 0.05 },
              size: { width: 0, height: 0 }
            }]
          };
        } else if (state.value === 'matrix') {
          // Configuration pour le thème "Matrix"
          newOptions = {
            background: { color: { value: '#000000' } },
            fpsLimit: 120,
            particles: {
              color: { value: '#00ff00' }, // Vert Matrix
              // Utilise du texte au lieu de formes
              shape: {
                type: "text" as const,
                options: {
                  text: {
                    value: ["0", "1"], // Les caractères à afficher
                    font: "Verdana",
                    style: "",
                    weight: "400"
                  }
                }
              },
              number: {
                density: { enable: true },
                value: 500
              },
              opacity: { value: { min: 0.2, max: 0.8 } },
              // Taille plus grande pour que les chiffres soient lisibles
              size: {
                value: 16
              },
              move: {
                enable: true,
                speed: 3,
                direction: "bottom" as const,
                straight: true, // Les chiffres tombent droit
              },
            }
          };
        } else if (state.value === 'snow') {
          // Configuration pour le thème "Winter"
          newOptions = {
            background: { color: { value: '#37474F' } }, // Fond gris-bleu nuit
            fpsLimit: 120,
            particles: {
              color: { value: '#ffffff' },
              move: {
                enable: true,
                speed: 1,
                direction: "bottom" as const,
                straight: false, // Les particules ne tombent pas en ligne droite
                wobble: {
                  enable: true,
                  distance: 5, // L'amplitude de l'oscillation
                  speed: 10      // La vitesse de l'oscillation
                }
              },
              number: {
                density: { enable: true },
                value: 200 // Plus de flocons
              },
              opacity: { value: { min: 0.3, max: 1 } },
              shape: { type: 'circle' as const },
              size: { value: { min: 1, max: 4 } }
            }
          };
        } else if (state.value === 'constellation') {
          // Configuration pour le thème "Constellation"
          newOptions = {
            background: { color: { value: '#111827' } }, // Fond nuit étoilée
            fpsLimit: 120,
            interactivity: {
              events: {
                onHover: {
                  enable: true,
                  mode: 'grab' // "Attrape" les particules proches avec la souris
                }
              },
              modes: {
                grab: {
                  distance: 250,
                  links: {
                    opacity: 1
                  }
                }
              }
            },
            particles: {
              color: { value: '#ffffff' },
              // La section clé pour cet effet
              links: {
                color: '#ffffff',
                distance: 150,
                enable: true, // On active les liens !
                opacity: 0.2,
                width: 1
              },
              move: {
                enable: true,
                speed: 0.2, // Mouvement très lent pour un effet flottant
                direction: 'none' as const,
              },
              number: {
                density: { enable: true },
                value: 80
              },
              opacity: { value: 0.3 },
              shape: { type: 'circle' as const },
              size: { value: { min: 1, max: 3 } }
            },
            detectRetina: true
          };
        } else  {
          // Configuration par défaut (pastel)
          newOptions = {
            background: { color: { value: '#ffffffff' } },
            fpsLimit: 120,
            interactivity: {
              events: { onHover: { enable: true, mode: 'bubble' } },
              modes: { bubble: { distance: 250, duration: 2, opacity: 0.8, size: 20 } }
            },
            particles: {
              color: { value: ['#ffd1dc', '#b2e2f2', '#e0c3fc', '#fbd8d8'] },
              links: { enable: false },
              move: { enable: true, speed: 0.5, direction: 'top' as const, outModes: { default: 'out' as const } },
              number: { density: { enable: true }, value: 150 },
              opacity: { value: { min: 0.1, max: 0.5 } },
              shape: { type: 'circle' as const },
              size: { value: { min: 1, max: 8 } }
            },
            detectRetina: true
          };
        }
        // On met à jour le signal, ce qui re-rendra le composant
        this.particlesOptions.set(newOptions);

        // On force la re-création du composant
        this.isVisible.set(false);
        setTimeout(() => this.isVisible.set(true), 0);
      }
    });
  }

  async particlesInit(engine: any): Promise<void> {
    await loadFull(engine);
  }
}
