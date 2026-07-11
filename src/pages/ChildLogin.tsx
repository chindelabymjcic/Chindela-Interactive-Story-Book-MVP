import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, Delete, ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";

export default function ChildLogin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [childId, setChildId] = useState("");
  const login = trpc.auth.childLogin.useMutation({ onSuccess: () => navigate("/child"), onError: () => { setError("That child ID or PIN is not correct."); setPin(""); } });

  // In a real app, this would validate against the database
  // For now, we'll use a simple demo PIN system
  const handlePin = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");

      if (newPin.length === 4) {
        const id = Number(childId);
        if (!Number.isInteger(id) || id < 1) { setError("Enter your child ID first."); setPin(""); return; }
        login.mutate({ childId: id, pin: newPin });
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        <Card className="border-4 border-amber-200 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Child Login</CardTitle>
            <p className="text-sm text-gray-500">Enter your 4-digit PIN</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input type="number" min="1" value={childId} onChange={(e) => setChildId(e.target.value)} placeholder="Child ID (from your parent)" aria-label="Child ID" />
            {/* PIN Display */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    i < pin.length
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-gray-200 text-gray-300"
                  }`}
                >
                  {i < pin.length ? "*" : ""}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePin(digit)}
                  className="h-14 rounded-xl bg-gradient-to-b from-white to-gray-50 border-2 border-gray-100 text-xl font-bold text-gray-700 shadow-sm hover:shadow-md hover:border-amber-300 transition-all active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-14 rounded-xl bg-gray-100 text-sm font-medium text-gray-500 hover:bg-gray-200 transition-all"
              >
                Clear
              </button>
              <button
                onClick={() => handlePin("0")}
                className="h-14 rounded-xl bg-gradient-to-b from-white to-gray-50 border-2 border-gray-100 text-xl font-bold text-gray-700 shadow-sm hover:shadow-md hover:border-amber-300 transition-all active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              Ask your parent for your PIN
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
