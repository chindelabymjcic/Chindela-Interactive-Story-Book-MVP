import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-secondary/30 via-background to-background">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card className="text-center shadow-lifted">
          <CardHeader>
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent"
            >
              <Compass className="h-7 w-7" />
            </motion.div>
            <CardTitle className="font-display text-4xl font-bold">404</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">This page wandered off the path.</p>
            <Button asChild className="w-full rounded-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
