import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SymptomAnalysis {
  possibleConditions: string[];
  severity: number;
  recommendations: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  disclaimer: string;
}

interface SymptomEntry {
  id: string;
  symptoms: string[];
  severity: number;
  duration: string;
  additionalInfo?: string;
  analysis: SymptomAnalysis;
}

export default function SymptomChecker() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [currentSymptoms, setCurrentSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState("");
  const [severity, setSeverity] = useState<number[]>([5]);
  const [duration, setDuration] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysis | null>(null);

  // Get previous symptom entries
  const { data: symptoms = [], isLoading: isLoadingSymptoms } = useQuery({
    queryKey: ['/api/symptoms', currentUser?.id],
    enabled: !!currentUser?.id
  });

  const analyzeSymptomsMutation = useMutation({
    mutationFn: async (data: {
      symptoms: string[];
      severity: number;
      duration: string;
      additionalInfo?: string;
    }) => {
      const response = await apiRequest('POST', '/api/symptoms/analyze', data);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      queryClient.invalidateQueries({ queryKey: ['/api/symptoms', currentUser?.id] });
      toast({
        title: "Symptoms analyzed successfully",
        description: "AI analysis completed. Please review the results and recommendations.",
      });
      // Clear form
      setCurrentSymptoms([]);
      setNewSymptom("");
      setSeverity([5]);
      setDuration("");
      setAdditionalInfo("");
    },
    onError: (error) => {
      console.error('Symptom analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze symptoms. Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    }
  });

  const addSymptom = () => {
    if (newSymptom.trim() && !currentSymptoms.includes(newSymptom.trim())) {
      setCurrentSymptoms([...currentSymptoms, newSymptom.trim()]);
      setNewSymptom("");
    }
  };

  const removeSymptom = (symptom: string) => {
    setCurrentSymptoms(currentSymptoms.filter(s => s !== symptom));
  };

  const handleAnalyze = () => {
    if (currentSymptoms.length === 0 || !duration) {
      return;
    }

    analyzeSymptomsMutation.mutate({
      symptoms: currentSymptoms,
      severity: severity[0],
      duration,
      additionalInfo: additionalInfo || undefined
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Symptom Checker</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get AI-powered insights about your symptoms and health concerns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symptom Input Form */}
        <Card data-testid="card-symptom-input">
          <CardHeader>
            <CardTitle>Describe Your Symptoms</CardTitle>
            <CardDescription>
              Enter your symptoms and get AI-powered health insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Symptoms */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Symptoms</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a symptom (e.g., headache, fever)"
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                  data-testid="input-symptom"
                />
                <Button
                  onClick={addSymptom}
                  disabled={!newSymptom.trim()}
                  data-testid="button-add-symptom"
                >
                  Add
                </Button>
              </div>
              
              {/* Current Symptoms */}
              {currentSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentSymptoms.map((symptom, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                      data-testid={`badge-symptom-${index}`}
                    >
                      {symptom}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSymptom(symptom)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Severity: {severity[0]}/10
              </label>
              <Slider
                value={severity}
                onValueChange={setSeverity}
                max={10}
                min={1}
                step={1}
                className="w-full"
                data-testid="slider-severity"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger data-testid="select-duration">
                  <SelectValue placeholder="How long have you had these symptoms?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less than 1 hour">Less than 1 hour</SelectItem>
                  <SelectItem value="1-6 hours">1-6 hours</SelectItem>
                  <SelectItem value="6-24 hours">6-24 hours</SelectItem>
                  <SelectItem value="1-3 days">1-3 days</SelectItem>
                  <SelectItem value="3-7 days">3-7 days</SelectItem>
                  <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                  <SelectItem value="2-4 weeks">2-4 weeks</SelectItem>
                  <SelectItem value="more than 1 month">More than 1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Information (Optional)</label>
              <Textarea
                placeholder="Any additional details about your symptoms, triggers, or context..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                data-testid="textarea-additional-info"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={currentSymptoms.length === 0 || !duration || analyzeSymptomsMutation.isPending}
              className="w-full"
              data-testid="button-analyze-symptoms"
            >
              {analyzeSymptomsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Symptoms...
                </>
              ) : (
                'Analyze Symptoms'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card data-testid="card-analysis-results">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-powered health insights based on your symptoms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyzeSymptomsMutation.isPending ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Analyzing your symptoms...</p>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4">
                {/* Urgency Level */}
                <div className={`p-3 rounded-lg border flex items-center gap-2 ${getUrgencyColor(analysisResult.urgencyLevel)}`}>
                  {getUrgencyIcon(analysisResult.urgencyLevel)}
                  <span className="font-medium capitalize">
                    {analysisResult.urgencyLevel} Priority
                  </span>
                </div>

                {/* Possible Conditions */}
                {analysisResult.possibleConditions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Possible Conditions</h4>
                    <div className="space-y-1">
                      {analysisResult.possibleConditions.map((condition, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                          data-testid={`text-condition-${index}`}
                        >
                          {condition}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <div className="space-y-1">
                      {analysisResult.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm"
                          data-testid={`text-recommendation-${index}`}
                        >
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Disclaimer */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription data-testid="text-disclaimer">
                    {analysisResult.disclaimer}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter your symptoms and click "Analyze Symptoms" to get AI-powered health insights.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous Symptom Entries */}
      <Card data-testid="card-previous-entries">
        <CardHeader>
          <CardTitle>Previous Symptom Entries</CardTitle>
          <CardDescription>
            Your recent symptom analysis history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSymptoms ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (symptoms as any[]).length > 0 ? (
            <div className="space-y-4">
              {(symptoms as any[]).slice(0, 5).map((entry: any, index: number) => {
                let analysis;
                try {
                  analysis = entry.recommendations ? JSON.parse(entry.recommendations) : null;
                } catch {
                  analysis = null;
                }
                
                return (
                  <div
                    key={entry.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    data-testid={`card-previous-entry-${index}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-wrap gap-1">
                        {entry.symptoms.map((symptom: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Severity: {entry.severity}/10 • Duration: {entry.duration}
                    </div>
                    {analysis && (
                      <div className={`mt-2 px-2 py-1 rounded text-xs ${getUrgencyColor(analysis.urgencyLevel)}`}>
                        {analysis.urgencyLevel} priority
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No previous symptom entries found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}