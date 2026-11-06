import { inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationError } from '@angular/router';

// Les pages (jeu, niveaux, dossier, réglages) sont chargées à la demande, chacune dans son fichier. Un onglet ouvert
// avant une mise à jour du jeu (ou avant un redémarrage du serveur de développement) réclame des fichiers qui
// n'existent plus : sans rien faire, le clic resterait sans effet. On recharge alors la page demandée, une seule
// fois, pour que le navigateur récupère la nouvelle version.
const RELOAD_KEY = 'turings_node_reloaded_at';
// Si le fichier manque encore juste après le rechargement, on n'insiste pas : pas de boucle de rechargements
const RELOAD_GUARD_MS = 10 * 1000;
const MISSING_CHUNK = /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

export function reloadOnMissingChunk(error: NavigationError, reload = (url: string) => window.location.assign(url)): void {
  const message = String((error.error as Error | undefined)?.message ?? error.error);
  if (!MISSING_CHUNK.test(message)) return;

  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY));
    if (Date.now() - lastReload < RELOAD_GUARD_MS) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return; // Sans stockage, impossible d'éviter une boucle : on ne recharge pas
  }
  reload(inject(Location).prepareExternalUrl(error.url));
}
