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
        } else if (state.value === 'night') {
          newOptions = {
            background: { color: { value: '#000014' } },
            fpsLimit: 60,
            particles: {
              color: { value: ['#6e44ff', '#b892ff', '#9e00ff', '#ff4ecd'] },
              links: {
                enable: true,
                distance: 100,
                opacity: 0.05,
                color: '#ffffff',
                width: 2
              },
              move: {
                enable: true,
                speed: 0.4,
                direction: 'none',
                outModes: { default: 'out' }
              },
              number: {
                value: 120,
                density: { enable: true }
              },
              opacity: {
                value: { min: 0.1, max: 0.4 },
                animation: {
                  enable: true,
                  speed: 0.2,
                  sync: false
                }
              },
              size: {
                value: { min: 2, max: 6 },
                animation: {
                  enable: true,
                  speed: 2,
                  minimumValue: 1,
                  sync: false
                }
              },
              shape: { type: 'circle' }
            }
          };
        } else if (state.value === 'neural') { // not used yet
          newOptions = {
            background: { color: { value: '#0a0a0a' } },
            fpsLimit: 60,
            particles: {
              color: { value: '#00ffe7' },
              links: {
                enable: true,
                color: '#00ffe7',
                distance: 80,
                opacity: 0.1, // Liens ambiants très faibles
                width: 1,
                triangles: {
                  enable: true,
                  opacity: 0.05
                }
              },
              move: {
                enable: true,
                speed: 0.5,
                direction: 'none' as const,
                outModes: { default: 'bounce' as const }
              },
              number: {
                value: 200,
                density: { enable: true }
              },
              opacity: {
                value: 0.2,
                animation: { enable: true, speed: 2, sync: false }
              },
              shape: { type: 'circle' as const },
              size: {
                value: 3
              }
            },
            interactivity: {
              events: {
                onHover: {
                  enable: true,
                  mode: 'connect'
                },
              },
              modes: {
                connect: {
                  radius: 200,
                  links: {
                    opacity: 0.7
                  }
                }
              }
            }
          };
        } else if (state.value === 'fireflies') { // not used yet
          newOptions = {
            background: { color: { value: '#0d1b2a' } },
            fpsLimit: 60,
            particles: {
              color: { value: '#faff70' },
              move: {
                enable: true,
                speed: 0.3,
                direction: 'none',
                random: true,
                outModes: { default: 'bounce' }
              },
              number: { density: { enable: true }, value: 200 },
              opacity: {
                value: { min: 0.1, max: 1 },
                animation: { enable: true, speed: 1, minimumValue: 0.1, sync: false }
              },
              shape: { type: 'circle' },
              size: { value: { min: 1, max: 3 } }
            }
          };
        } else if (state.value === 'bubbles') { // not used yet
          newOptions = {
            background: { color: { value: '#00334e' } },
            fpsLimit: 60,
            particles: {
              color: { value: '#ffffff' },
              shape: { type: 'circle' },
              opacity: {
                value: 0.4,
                animation: {
                  enable: true,
                  speed: 0.2,
                  minimumValue: 0.1,
                  sync: false
                }
              },
              size: {
                value: { min: 3, max: 10 },
                animation: {
                  enable: true,
                  speed: 1,
                  minimumValue: 1,
                  sync: false
                }
              },
              move: {
                enable: true,
                speed: 0.5,
                direction: 'top',
                outModes: { default: 'out' }
              },
              number: {
                density: { enable: true },
                value: 80
              }
            }
          };

        } else if (state.value === 'fireworks') { // not finished yet
          newOptions = {
            background: { color: { value: '#000000' } },
            fpsLimit: 60,
            particles: {
              color: { value: ['#ff0000', '#ffae00', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'] },
              move: {
                enable: true,
                speed: { min: 2, max: 6 },
                direction: 'none',
                outModes: { default: 'destroy' }
              },
              number: { value: 0 },
              size: { value: { min: 2, max: 4 } },
              opacity: { value: 1 },
              shape: { type: 'circle' },
              life: {
                duration: { sync: true, value: 2 },
                count: 1
              }
            },
            emitters: {
              direction: 'none',
              rate: {
                quantity: 100,
                delay: 1
              },
              size: { width: 0, height: 0 },
              position: { x: 50, y: 50 }
            }
          };
        } else if (state.value === 'cyberpunk') { // not finished yet
          newOptions = {
            background: { color: { value: '#0a0a0f' } },
            fpsLimit: 60,
            particles: {
              number: {
                value: 400,
                density: { enable: true }
              },
              color: {
                value: ['#ff00ff', '#00ffff'] // Rose néon et bleu néon
              },
              shape: {
                type: 'char',
                options: {
                  char: {
                    value: ['¥', 'Ж', 'λ', 'Ψ', 'π', 'Σ', '∇', 'µ', 'æ', '⛧'],
                    font: 'Courier New',
                    style: '',
                    weight: 'bold'
                  }
                }
              },
              size: {
                value: 14,
                animation: {
                  enable: true,
                  speed: 4,
                  minimumValue: 10
                }
              },
              opacity: {
                value: { min: 0.1, max: 0.8 },
                animation: {
                  enable: true,
                  speed: 0.5,
                  sync: false
                }
              },
              move: {
                enable: true,
                speed: 1.5,
                direction: 'top-right', // Contraire de Matrix !
                straight: false,
                outModes: { default: 'out' }
              }
            },
            interactivity: {
              events: {
                onHover: {
                  enable: true,
                  mode: 'trail'
                }
              },
              modes: {
                trail: {
                  delay: 0.005,
                  quantity: 1,
                  particles: {
                    color: { value: '#ffffff' },
                    move: { speed: 3, direction: 'none' },
                    size: { value: 10 },
                    opacity: { value: 1 },
                    life: { duration: 0.2, count: 1 }
                  }
                }
              }
            },
            detectRetina: true
          };
        } else if (state.value === 'burnt' ) { // maybe when more than 70 % of the buttons are depleted ?
          newOptions = {
            background: { color: { value: '#100c08' } },
            fpsLimit: 120,
            interactivity: {
                events: { onHover: { enable: false } },
            },
            particles: {
                color: { value: ['#ff5722', '#ffc107', '#e91e63'] },
                links: { enable: false },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'top' as const,
                    outModes: { default: 'out' as const }
                },
                number: { density: { enable: true }, value: 80 },
                opacity: { value: { min: 0.1, max: 0.8 } },
                shape: { type: 'circle' as const },
                size: { value: { min: 1, max: 4 } }
            },
            detectRetina: true
          };
        } else if (state.value === 'abyss' ) { // not used yet
          newOptions = {
            background: { color: { value: '#03001C' } },
            fpsLimit: 120,
            interactivity: {
                events: { onHover: { enable: true, mode: 'bubble' } },
                modes: {
                    bubble: {
                        distance: 200,
                        duration: 2,
                        opacity: 1,
                        size: 15
                    }
                }
            },
            particles: {
                color: { value: '#30A2FF' },
                links: { enable: false },
                move: {
                    enable: true,
                    speed: 1,
                    direction: 'top' as const,
                    outModes: { default: 'out' as const }
                },
                number: { density: { enable: true }, value: 50 },
                opacity: { value: { min: 0.1, max: 0.5 } },
                shape: { type: 'circle' as const },
                size: { value: { min: 2, max: 10 } }
            },
            detectRetina: true
          };
        } else if (state.value === 'aurea' ) { // not used yet
          newOptions = {
            background: { color: { value: '#1C0A00' } },
            fpsLimit: 120,
            interactivity: {
                events: { onHover: { enable: true, mode: 'repulse' } },
                modes: {
                    repulse: {
                        distance: 150,
                        duration: 0.4
                    }
                }
            },
            particles: {
                color: { value: '#FFD700' },
                links: { enable: false },
                move: {
                    enable: true,
                    speed: 1.5,
                    direction: 'bottom' as const,
                    outModes: { default: 'out' as const }
                },
                number: { density: { enable: true }, value: 100 },
                opacity: { value: { min: 0.3, max: 0.8 } },
                shape: { type: 'star' as const },
                size: { value: { min: 1, max: 4 } }
            },
            detectRetina: true
          };
        } else { // Configuration par défaut (pastel)
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
