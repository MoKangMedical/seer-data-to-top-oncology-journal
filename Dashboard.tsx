import DashboardLayout from "@/components/DashboardLayout";
import SEERPublications from "@/components/SEERPublications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  FolderOpen, 
  Clock, 
  MoreVertical,
  Trash2,
  Edit,
  Loader2,
  FileText,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StudyDesign = "cohort" | "case_control" | "survival" | "competing_risk";

const studyDesignLabels: Record<StudyDesign, string> = {
  cohort: "回顾性队列研究",
  case_control: "病例对照研究",
  survival: "生存分析",
  competing_risk: "竞争风险分析",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "badge-draft" },
  in_progress: { label: "进行中", className: "badge-progress" },
  completed: { label: "已完成", className: "badge-completed" },
  archived: { label: "已归档", className: "bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium" },
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  
  // Form state
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    cancerType: "",
    studyDesign: "" as StudyDesign | "",
  });

  // Queries and mutations
  const { data: projects, isLoading, refetch } = trpc.project.list.useQuery();
  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      toast.success("项目创建成功");
      setIsCreateDialogOpen(false);
      setNewProject({ title: "", description: "", cancerType: "", studyDesign: "" });
      refetch();
      setLocation(`/project/${project.id}`);
    },
    onError: (error) => {
      toast.error("创建失败: " + error.message);
    },
  });
  
  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      toast.success("项目已删除");
      setDeleteProjectId(null);
      refetch();
    },
    onError: (error) => {
      toast.error("删除失败: " + error.message);
    },
  });

  const handleCreateProject = () => {
    if (!newProject.title.trim()) {