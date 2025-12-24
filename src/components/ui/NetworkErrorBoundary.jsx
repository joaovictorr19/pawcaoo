import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Enhanced error boundary with retry logic
export class NetworkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      retryCount: 0,
      maxRetries: 3
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Auto-retry para erros de rede
    if (this.isNetworkError(error) && this.state.retryCount < this.state.maxRetries) {
      setTimeout(() => {
        this.handleRetry();
      }, 2000 * (this.state.retryCount + 1)); // Backoff exponencial
    }
  }

  isNetworkError(error) {
    const networkErrors = [
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'ERR_INTERNET_DISCONNECTED',
      'ERR_CONNECTION_REFUSED'
    ];
    return networkErrors.some(msg => error?.message?.includes(msg));
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1
    }));
  };

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.isNetworkError(this.state.error);
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isNetworkError ? 'Sem Conexão' : 'Algo Correu Mal'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {isNetworkError 
                ? 'Verifique a sua conexão à internet e tente novamente.'
                : 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
            </p>

            {this.state.retryCount > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Tentativa {this.state.retryCount} de {this.state.maxRetries}
              </p>
            )}

            <Button
              onClick={this.handleManualRetry}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>

            {!isNetworkError && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Detalhes Técnicos
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;