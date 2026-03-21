import { Box } from "@mui/material";

interface IssueListProps {
  issues: string[];
}

export function IssueList({ issues }: IssueListProps) {
  if (issues.length === 0) return null;
  return (
    <Box component="ul" sx={{ m: 0, pl: 2 }}>
      {issues.map((issue, index) => (
        <li key={`${issue}-${index}`}>{issue}</li>
      ))}
    </Box>
  );
}
