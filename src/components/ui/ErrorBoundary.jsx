import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, MessageCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Robust error logging to prevent secondary errors
    try {
      console.error("ErrorBoundary caught an error", error, errorInfo);
      
      const safeError = error || new Error('Unknown error captured by boundary');
      
      console.error('Error details:', {
        message: safeError.message || 'Unknown error',
        name: safeError.name || 'Error',
        stack: safeError.stack || 'No stack trace available'
      });
    } catch (loggingError) {
      console.error("Error while logging error:", loggingError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-white rounded-xl border border-red-100 shadow-sm">
          <div className="bg-red-50 p-3 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Ocorreu um erro inesperado ao carregar esta seção. Nossa equipe já foi notificada.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => this.setState({ hasError: false })} 
              variant="outline"
            >
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Recarregar Página
            </Button>
          </div>
          {typeof window !== 'undefined' && this.state.error && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left w-full max-w-lg overflow-auto text-xs font-mono text-red-800 border border-red-200">
              <div className="mb-2 font-bold">Error:</div>
              {this.state.error?.message || this.state.error?.toString() || 'Unknown error'}
              {this.state.error?.stack && (
                <>
                  <div className="mt-3 mb-2 font-bold">Stack:</div>
                  <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;