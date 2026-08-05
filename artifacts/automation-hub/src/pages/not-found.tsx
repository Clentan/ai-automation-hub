import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { SearchX, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className="relative bg-background border border-border shadow-sm rounded-full w-full h-full flex items-center justify-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Page not found</h1>
          <p className="text-muted-foreground text-lg">
            We couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button onClick={() => window.history.back()} variant="outline" className="w-full sm:w-auto rounded-full gap-2">
            <ArrowLeft className="h-4 w-4" /> Go back
          </Button>
          <Link href="/">
            <Button className="w-full sm:w-auto rounded-full gap-2 shadow-md">
              <Home className="h-4 w-4" /> Back to home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}