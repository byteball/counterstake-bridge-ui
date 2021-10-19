const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#1e90ff',
              "@text-color": "#ffffff",
              "@text-color-secondary": "#ffffff",
              '@statistic-content-font-size': '16px',
              '@margin-sm': '5px',
              '@input-height-lg': '60px',
              '@input-height-base': '40px',
              "@select-single-item-height-lg": "60px",
              "@modal-header-bg": "#141414",
              "@modal-content-bg": "#141414",
              "@modal-footer-bg": "#141414",
              "@drawer-bg": "#141414",
              "@tooltip-bg": "#141414",
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ]
};