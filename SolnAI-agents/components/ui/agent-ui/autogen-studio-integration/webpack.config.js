/**
 * Webpack configuration for SolnAI AutoGen Studio plugin
 */

const path = require('path');

module.exports = {
  entry: './solnai-plugin.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'solnai-autogen-plugin.js',
    library: {
      type: 'umd',
      name: 'SolnAIAutoGenPlugin',
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    '@autogenstudio/sdk': 'AutoGenStudioSDK'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};