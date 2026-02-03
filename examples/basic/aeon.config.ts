import type { AeonConfig } from '@affectively/aeon-pages';

export default {
  pagesDir: './pages',
  componentsDir: './components',
  runtime: 'bun',
  port: 3000,

  aeon: {
    sync: {
      mode: 'distributed',
      replicationFactor: 3,
      consistencyLevel: 'strong',
    },
    versioning: {
      enabled: true,
      autoMigrate: true,
    },
    presence: {
      enabled: true,
      cursorTracking: true,
      inactivityTimeout: 60000,
    },
    offline: {
      enabled: true,
      maxQueueSize: 1000,
    },
  },

  components: {
    autoDiscover: true,
  },

  nextCompat: true,

  output: {
    dir: '.aeon',
  },
} satisfies AeonConfig;
