import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Box, Card, CardContent,
  AppBar, Toolbar, Button, Alert, Chip, LinearProgress
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

interface WaiverData {
  memberScore: number;
  recommendation: string;
  waivePercentage: number;
  stats: {
    totalBorrows: number;
    onTimeReturns: number;
    paidFines: number;
    unpaidFines: number;
    totalFineAmount: number;
  };
  algorithm: string;
  mlConcept: string;
  aiDecision: string;
}

const FineWaiver: React.FC = () => {
  const [data, setData] = useState<WaiverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchWaiver();
  }, []);

  const fetchWaiver = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/ml/fine-waiver/" + user.id,
        { headers: { Authorization: "Bearer " + token } }
      );
      setData(res.data);
    } catch (err) {
      setError("Failed to load waiver info");
    }
    setLoading(false);
  };

  const getRecommendationIcon = (rec: string) => {
    if (rec === "approve") return <CheckCircleIcon sx={{ fontSize: 60, color: "#388e3c" }} />;
    if (rec === "partial") return <RemoveCircleIcon sx={{ fontSize: 60, color: "#f57c00" }} />;
    return <CancelIcon sx={{ fontSize: 60, color: "#d32f2f" }} />;
  };

  const getRecommendationColor = (rec: string) => {
    if (rec === "approve") return "#388e3c";
    if (rec === "partial") return "#f57c00";
    return "#d32f2f";
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <GavelIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Smart Fine Waiver
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Typography>Calculating your member score...</Typography>
        ) : data && (
          <>
            <Card sx={{ mb: 4, overflow: "hidden" }}>
              <Box sx={{
                background: "linear-gradient(135deg, #3E2723, #5D4037)",
                p: 3, color: "white"
              }}>
                <Typography variant="h5">🤖 AI Fine Waiver Decision</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {data.algorithm} • {data.mlConcept}
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ textAlign: "center", py: 3 }}>
                  {getRecommendationIcon(data.recommendation)}
                  <Typography variant="h3" sx={{
                    color: getRecommendationColor(data.recommendation),
                    fontWeight: "bold", mt: 1
                  }}>
                    {data.recommendation === "approve" ? "APPROVED" :
                     data.recommendation === "partial" ? "PARTIAL" : "DENIED"}
                  </Typography>
                  <Typography variant="h5" color="textSecondary">
                    {data.waivePercentage}% Fine Waiver
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Member Score: {data.memberScore}/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={data.memberScore}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getRecommendationColor(data.recommendation),
                        borderRadius: 6
                      }
                    }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography variant="caption" color="error">Poor (0)</Typography>
                    <Typography variant="caption" color="warning.main">Average (50)</Typography>
                    <Typography variant="caption" color="success.main">Excellent (100)</Typography>
                  </Box>
                </Box>

                <Alert severity={
                  data.recommendation === "approve" ? "success" :
                  data.recommendation === "partial" ? "warning" : "error"
                } sx={{ mb: 3 }}>
                  <Typography variant="body2">{data.aiDecision}</Typography>
                </Alert>

                <Typography variant="h6" gutterBottom>Member Statistics</Typography>
                <Box sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2
                }}>
                  {[
                    { label: "Total Borrows", value: data.stats.totalBorrows },
                    { label: "On-Time Returns", value: data.stats.onTimeReturns },
                    { label: "Paid Fines", value: data.stats.paidFines },
                    { label: "Unpaid Fines", value: data.stats.unpaidFines },
                    { label: "Total Fine Amount", value: "Rs. " + data.stats.totalFineAmount }
                  ].map((stat, i) => (
                    <Card key={i} sx={{ bgcolor: "#FFF8E1" }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="body2" color="textSecondary">
                          {stat.label}
                        </Typography>
                        <Typography variant="h6" color="primary.dark">
                          {stat.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip label={"Score: " + data.memberScore + "/100"} color="primary" />
              <Chip label={"Waiver: " + data.waivePercentage + "%"}
                color={data.recommendation === "approve" ? "success" :
                  data.recommendation === "partial" ? "warning" : "error"} />
              <Chip label={data.mlConcept} color="secondary" />
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default FineWaiver;