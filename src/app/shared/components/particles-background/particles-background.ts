import { Component, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgParticlesService, NgxParticlesModule } from '@tsparticles/angular';
import type { Engine, ISourceOptions } from '@tsparticles/engine';
import { BackgroundService } from '../../../core/services/background';

// Les modules de tsParticles arrivent dans un fichier à part, pour ne pas alourdir le premier chargement.
// Toujours la même fonction : NgParticlesService refuse un rappel différent d'une création à l'autre.
const loadParticlesModules = async (engine: Engine) => (await import('tsparticles')).loadFull(engine);

// Un fond affiché. Le nouveau apparaît en fondu par-dessus l'ancien, retiré une fois le fondu terminé.
interface ParticlesLayer {
  id: string;
  options: ISourceOptions;
}


@Component({
  selector: 'app-particles-background',
  standalone: true,
  imports: [NgxParticlesModule],
  templateUrl: './particles-background.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './particles-background.scss'
})

export class ParticlesBackgroundComponent {
  public readonly layers = signal<ParticlesLayer[]>([]);
  private layerCount = 0;
  // Même durée que l'animation de fondu dans particles-background.scss
  private readonly FADE_DURATION_MS = 800;
  // tsParticles doit être initialisé (avec tous ses modules) avant d'afficher <ngx-particles>
  public readonly isEngineReady = signal(false);

  // 2. On injecte les services
  constructor(private backgroundService: BackgroundService, particlesService: NgParticlesService) {
    particlesService.init(loadParticlesModules).then(() => this.isEngineReady.set(true));

    // 3. On utilise un `effect` pour réagir aux changements
    effect(() => {
      const state = this.backgroundService.state();

      // On ne reconstruit les options que si le thème est bien "particules"
      if (state.type === 'particles') {
        let newOptions: ISourceOptions = {};

        // On regarde si un thème spécifique est demandé (ex: 'angry')
        if (state.value === 'angry') {
          // Thème "Angry" (tous les boutons sont rouges) : une fontaine adoucie, en rouge corail sur fond rosé,
          // dont les gouttes ralentissent et s'estompent pour ne pas agresser les yeux
          newOptions = {
            background: {
              color: { value: '#fff5f5' },
              // Texture : des ondes concentriques autour de la fontaine, un centre plus clair et des bords rosés
              image: [
                'radial-gradient(circle at 50% 55%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 35%)',
                'radial-gradient(circle at 50% 55%, rgba(229, 62, 62, 0) 45%, rgba(229, 62, 62, 0.16) 100%)',
                'repeating-radial-gradient(circle at 50% 55%, rgba(229, 62, 62, 0.07) 0 2px, rgba(229, 62, 62, 0) 2px 16px)'
              ].join(', ')
            },
            fpsLimit: 60,
            particles: {
              paint: { color: { value: ['#fc8181', '#f56565', '#feb2b2'] } },
              move: { enable: true, speed: { min: 2.5, max: 5.5 }, outModes: { default: "destroy" as const } },
              number: { value: 0 },
              opacity: {
                value: { min: 0, max: 0.8 },
                animation: { enable: true, speed: 0.5, startValue: 'max', destroy: 'min', sync: false }
              },
              shape: { type: "circle" as const },
              size: { value: { min: 1, max: 3 } },
              life: { duration: { value: 4 }, count: 1 }
            },
            emitters: [{
              position: { x: 50, y: 55 },
              rate: { quantity: 6, delay: 0.05 },
              size: { width: 0, height: 0 }
            }]
          };
        } else if (state.value === 'matrix') {
          // Configuration pour le thème "Matrix"
          newOptions = {
            background: { color: { value: '#000000' } },
            fpsLimit: 120,
            particles: {
              paint: { color: { value: '#00ff00' } }, // Vert Matrix
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
              paint: { color: { value: '#ffffff' } },
              move: {
                enable: true,
                speed: 1,
                direction: "bottom" as const,
                straight: false, // Les particules ne tombent pas en ligne droite
              },
              wobble: {
                enable: true,
                distance: 5, // L'amplitude de l'oscillation
                speed: 10      // La vitesse de l'oscillation
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
              paint: { color: { value: '#ffffff' } },
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
              paint: { color: { value: ['#6e44ff', '#b892ff', '#9e00ff', '#ff4ecd'] } },
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
        } else if (state.value === 'neural') { // Niveaux des pionniers de l'intelligence artificielle
          newOptions = {
            background: { color: { value: '#0a0a0a' } },
            fpsLimit: 60,
            particles: {
              paint: { color: { value: '#00ffe7' } },
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
        } else if (state.value === 'fireflies') { // Fond de nuit, entre minuit et 4 heures
          newOptions = {
            background: { color: { value: '#0d1b2a' } },
            fpsLimit: 60,
            particles: {
              paint: { color: { value: '#faff70' } },
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
        } else if (state.value === 'bubbles') { // Quand le joueur « bulle » : une minute sans cliquer
          newOptions = {
            background: { color: { value: '#00334e' } },
            fpsLimit: 60,
            particles: {
              paint: { color: { value: '#ffffff' } },
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

        } else if (state.value === 'fireworks') { // Quand un bouton devient légendaire
          // Un bouquet = une gerbe d'étincelles d'une seule couleur, qui éclate au même endroit à intervalle régulier
          const bouquet = (x: number, y: number, delay: number, color: string, startCount = 0) => ({
            position: { x, y },
            size: { width: 0, height: 0 },
            rate: { quantity: 70, delay },
            startCount,
            particles: { paint: { color: { value: color } } }
          });
          newOptions = {
            background: { color: { value: '#05051a' } },
            fpsLimit: 60,
            particles: {
              number: { value: 0 },
              shape: { type: 'circle' as const },
              size: { value: { min: 1.5, max: 3 } },
              // Les étincelles ralentissent, retombent et s'éteignent (de max à min, puis disparaissent)
              opacity: {
                value: { min: 0, max: 1 },
                animation: { enable: true, speed: 1.2, startValue: 'max', destroy: 'min', sync: false }
              },
              life: { count: 1, duration: { value: 2 } },
              move: {
                enable: true,
                direction: 'none' as const,
                speed: { min: 4, max: 12 },
                decay: 0.05,
                gravity: { enable: true, acceleration: 3 },
                outModes: { default: 'destroy' as const }
              }
            },
            emitters: [
              bouquet(25, 35, 1.6, '#ff595e', 70),
              bouquet(72, 25, 2.1, '#ffca3a'),
              bouquet(50, 55, 1.8, '#8ac926'),
              bouquet(85, 60, 2.4, '#4cc9f0'),
              bouquet(15, 70, 2.7, '#ff70a6')
            ],
            detectRetina: true
          };
        } else if (state.value === 'casino') { // Quand le score contient « 777 »
          // Une pluie de symboles de machine à sous sur un tapis de jeu
          newOptions = {
            background: { color: { value: '#0b3d2e' } },
            fpsLimit: 60,
            particles: {
              shape: {
                type: 'emoji',
                options: { emoji: { value: ['7️⃣', '7️⃣', '🍒', '🔔', '💎', '🍋', '🍀', '🎰'] } }
              },
              number: { density: { enable: true }, value: 40 },
              opacity: { value: { min: 0.7, max: 1 } },
              size: { value: { min: 12, max: 22 } },
              rotate: {
                value: { min: 0, max: 360 },
                direction: 'random',
                animation: { enable: true, speed: 5, sync: false }
              },
              move: {
                enable: true,
                speed: { min: 1, max: 3 },
                direction: 'bottom' as const,
                straight: true,
                outModes: { default: 'out' as const }
              }
            },
            detectRetina: true
          };
        } else if (state.value === 'cyberpunk') { // Plantage de la division par zéro
          newOptions = {
            background: { color: { value: '#0a0a0f' } },
            fpsLimit: 60,
            particles: {
              number: {
                value: 400,
                density: { enable: true }
              },
              paint: {
                color: { value: ['#ff00ff', '#00ffff'] } // Rose néon et bleu néon
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
                    paint: { color: { value: '#ffffff' } },
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
        } else if (state.value === 'burnt') { // Quand tous les boutons limités ont épuisé leurs clics
          newOptions = {
            background: { color: { value: '#100c08' } },
            fpsLimit: 120,
            interactivity: {
                events: { onHover: { enable: false } },
            },
            particles: {
                paint: { color: { value: ['#ff5722', '#ffc107', '#e91e63'] } },
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
        } else if (state.value === 'abyss') { // Niveaux secrets
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
                paint: { color: { value: '#30A2FF' } },
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
        } else if (state.value === 'aurea') { // Quand une constante en or apparaît
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
                paint: { color: { value: '#FFD700' } },
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
              paint: { color: { value: ['#ffd1dc', '#b2e2f2', '#e0c3fc', '#fbd8d8'] } },
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
        // Nouvelle couche par-dessus les autres ; une fois son fondu terminé, celles d'en dessous sont retirées
        const layer: ParticlesLayer = { id: `tsparticles-${++this.layerCount}`, options: newOptions };
        this.layers.update(layers => [...layers, layer]);
        setTimeout(() => this.layers.update(layers => layers.slice(Math.max(layers.indexOf(layer), 0))), this.FADE_DURATION_MS);
      }
    });
  }
}
