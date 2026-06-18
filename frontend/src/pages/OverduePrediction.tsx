import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Box, Card, CardContent,
  AppBar, Toolbar, Button, Alert, Chip, LinearProgress
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PsychologyIcon from "@mui/icons-material/Psychology";

interface PredictionData {
  prediction: string;
  probability: string;
  riskScore: number;
  algorithm: string;
  mlConcept: string;
  features: {
    overdueRate: number;
    avgDaysLate: number;
    unpaidFines: number;
    totalFineAmount: number;
  };
  explanation: string;
}

const OverduePrediction: React.FC = () => {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPrediction();
  }, []);

  const fetchPrediction = async () => {
    try {
      const res = await axios.get(
        "https://library-management-system-ih9d.onrender.com/api/ml/overdue-prediction/" + user.id,
        { headers: { Authorization: "Bearer " + token } }
      );
      setData(res.data);
    } catch (err) {
      setError("Failed to load prediction");
    }
    setLoading(false);
  };

  const getRiskColor = (prediction: string) => {
    if (prediction === "high") return "#d32f2f";
    if (prediction === "medium") return "#f57c00";
    return "#388e3c";
  };

  const getRiskIcon = (prediction: string) => {
    if (prediction === "low") return <CheckCircleIcon sx={{ fontSize: 60, color: "#388e3c" }} />;
    return <WarningIcon sx={{ fontSize: 60, color: getRiskColor(prediction) }} />;
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <PsychologyIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Overdue Risk Prediction
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Typography>Analyzing your borrowing patterns...</Typography>
        ) : data && (
          <>
            <Card sx={{ mb: 4, overflow: "hidden" }}>
              <Box sx={{
                background: "linear-gradient(135deg, #3E2723, #5D4037)",
                p: 3, color: "white"
              }}>
                <Typography variant="h5">ðŸ¤– ML Risk Assessment</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {data.algorithm} â€¢ {data.mlConcept}
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ textAlign: "center", py: 3 }}>
                  {getRiskIcon(data.prediction)}
                  <Typography variant="h3" sx={{
                    color: getRiskColor(data.prediction),
                    fontWeight: "bold", mt: 1
                  }}>
                    {data.prediction.toUpperCase()} RISK
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    Risk Score: {data.riskScore}/100
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Risk Level
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={data.riskScore}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getRiskColor(data.prediction),
                        borderRadius: 6
                      }
                    }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography variant="caption" color="success.main">Low (0)</Typography>
                    <Typography variant="caption" color="warning.main">Medium (50)</Typography>
                    <Typography variant="caption" color="error">High (100)</Typography>
                  </Box>
                </Box>

                <Alert severity={
                  data.prediction === "high" ? "error" :
                  data.prediction === "medium" ? "warning" : "success"
                } sx={{ mb: 3 }}>
                  <Typography variant="body2">{data.explanation}</Typography>
                </Alert>

                {data.features && (
                  <Box sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2
                  }}>
                    {[
                      {
                        label: "Overdue Rate",
                        value: (data.features.overdueRate * 100).toFixed(0) + "%"
                      },
                      {
                        label: "Avg Days Late",
                        value: data.features.avgDaysLate.toFixed(1) + " days"
                      },
                      {
                        label: "Unpaid Fines",
                        value: data.features.unpaidFines
                      },
                      {
                        label: "Total Fine Amount",
                        value: "Rs. " + data.features.totalFineAmount
                      }
                    ].map((feat, i) => (
                      <Card key={i} sx={{ bgcolor: "#FFF8E1" }}>
                        <CardContent sx={{ py: 1.5 }}>
                          <Typography variant="body2" color="textSecondary">
                            {feat.label}
                          </Typography>
                          <Typography variant="h6" color="primary.dark">
                            {feat.value}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip label={"Algorithm: " + data.algorithm} color="primary" />
              <Chip label={"Probability: " + (Number(data.probability) * 100).toFixed(0) + "%"}
                color={data.prediction === "high" ? "error" :
                  data.prediction === "medium" ? "warning" : "success"} />
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default OverduePrediction;
