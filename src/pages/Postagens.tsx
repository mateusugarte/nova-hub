import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Check,
  Lightbulb,
  Calendar,
  Video,
  Image,
  MessageCircle,
  Link,
} from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentIdea {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  reference_link: string | null;
  is_posted: boolean;
  created_at: string;
}

interface PostedContent {
  id: string;
  title: string;
  content_type: string;
  post_link: string;
  channel: string;
  posted_date: string;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  reels: <Video className="w-4 h-4" />,
  feed: <Image className="w-4 h-4" />,
  story: <MessageCircle className="w-4 h-4" />,
};

const contentTypeColors: Record<string, string> = {
  reels: 'bg-purple-500',
  feed: 'bg-blue-500',
  story: 'bg-pink-500',
};

export default function Postagens() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [posts, setPosts] = useState<PostedContent[]>([]);
  const [isIdeaFormOpen, setIsIdeaFormOpen] = useState(false);
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMarkPostedDialogOpen, setIsMarkPostedDialogOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null);
  const [editingPost, setEditingPost] = useState<PostedContent | null>(null);
  const [markPostedLink, setMarkPostedLink] = useState('');
  const [markPostedChannel, setMarkPostedChannel] = useState('instagram');
  const [ideaForm, setIdeaForm] = useState({
    title: '',
    description: '',
    content_type: 'feed',
    reference_link: '',
  });
  const [postForm, setPostForm] = useState({
    title: '',
    content_type: 'feed',
    post_link: '',
    channel: 'instagram',
    posted_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    postsThisMonth: 0,
    postsThisWeek: 0,
    unpostedIdeas: 0,
  });
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const today = new Date();
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Fetch ideas
    const { data: ideasData } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setIdeas(ideasData || []);

    // Fetch posts
    const { data: postsData } = await supabase
      .from('posted_content')
      .select('*')
      .eq('user_id', user.id)
      .order('posted_date', { ascending: false });

    setPosts(postsData || []);

    // Stats
    const { count: postsThisMonth } = await supabase
      .from('posted_content')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('posted_date', monthStart)
      .lte('posted_date', monthEnd);

    const { count: postsThisWeek } = await supabase
      .from('posted_content')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('posted_date', weekStart)
      .lte('posted_date', weekEnd);

    const { count: unpostedIdeas } = await supabase
      .from('content_ideas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_posted', false);

    setStats({
      postsThisMonth: postsThisMonth || 0,
      postsThisWeek: postsThisWeek || 0,
      unpostedIdeas: unpostedIdeas || 0,
    });
  };

  const handleCreateIdea = () => {
    setEditingIdea(null);
    setIdeaForm({
      title: '',
      description: '',
      content_type: 'feed',
      reference_link: '',
    });
    setIsIdeaFormOpen(true);
  };

  const handleEditIdea = (idea: ContentIdea) => {
    setEditingIdea(idea);
    setIdeaForm({
      title: idea.title,
      description: idea.description || '',
      content_type: idea.content_type,
      reference_link: idea.reference_link || '',
    });
    setIsIdeaFormOpen(true);
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const data = {
      user_id: user.id,
      title: ideaForm.title,
      description: ideaForm.description || null,
      content_type: ideaForm.content_type,
      reference_link: ideaForm.reference_link || null,
    };

    let error;
    if (editingIdea) {
      const result = await supabase
        .from('content_ideas')
        .update(data)
        .eq('id', editingIdea.id);
      error = result.error;
    } else {
      const result = await supabase.from('content_ideas').insert(data);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao salvar ideia', variant: 'destructive' });
    } else {
      toast({ title: `Ideia ${editingIdea ? 'atualizada' : 'criada'} com sucesso` });
      setIsIdeaFormOpen(false);
      fetchData();
    }
  };

  const openMarkAsPostedDialog = (idea: ContentIdea) => {
    setSelectedIdea(idea);
    setMarkPostedLink(idea.reference_link || '');
    setMarkPostedChannel('instagram');
    setIsMarkPostedDialogOpen(true);
  };

  const handleMarkAsPosted = async () => {
    if (!selectedIdea || !user) return;

    setLoading(true);
    const now = new Date();
    
    // Update the idea as posted
    const { error: updateError } = await supabase
      .from('content_ideas')
      .update({ is_posted: true, posted_at: now.toISOString() })
      .eq('id', selectedIdea.id);

    if (updateError) {
      toast({ title: 'Erro ao marcar como postada', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Also create a record in posted_content
    const { error: insertError } = await supabase
      .from('posted_content')
      .insert({
        user_id: user.id,
        title: selectedIdea.title,
        content_type: selectedIdea.content_type,
        post_link: markPostedLink,
        channel: markPostedChannel,
        posted_date: format(now, 'yyyy-MM-dd'),
        content_idea_id: selectedIdea.id,
      });

    setLoading(false);

    if (insertError) {
      toast({ title: 'Erro ao registrar post', variant: 'destructive' });
      return;
    }

    toast({ title: 'Post registrado com sucesso!' });
    setIsMarkPostedDialogOpen(false);
    setSelectedIdea(null);
    setMarkPostedLink('');
    fetchData();
  };

  const handleDeleteIdea = async () => {
    if (!selectedIdea) return;

    const { error } = await supabase
      .from('content_ideas')
      .delete()
      .eq('id', selectedIdea.id);

    if (error) {
      toast({ title: 'Erro ao excluir ideia', variant: 'destructive' });
    } else {
      toast({ title: 'Ideia excluída' });
      setIsDeleteDialogOpen(false);
      fetchData();
    }
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setPostForm({
      title: '',
      content_type: 'feed',
      post_link: '',
      channel: 'instagram',
      posted_date: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsPostFormOpen(true);
  };

  const handleEditPost = (post: PostedContent) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      content_type: post.content_type,
      post_link: post.post_link,
      channel: post.channel,
      posted_date: post.posted_date,
    });
    setIsPostFormOpen(true);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    let error;
    if (editingPost) {
      const result = await supabase
        .from('posted_content')
        .update({
          title: postForm.title,
          content_type: postForm.content_type,
          post_link: postForm.post_link,
          channel: postForm.channel,
          posted_date: postForm.posted_date,
        })
        .eq('id', editingPost.id);
      error = result.error;
    } else {
      const result = await supabase.from('posted_content').insert({
        user_id: user.id,
        title: postForm.title,
        content_type: postForm.content_type,
        post_link: postForm.post_link,
        channel: postForm.channel,
        posted_date: postForm.posted_date,
      });
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao salvar post', variant: 'destructive' });
    } else {
      toast({ title: `Post ${editingPost ? 'atualizado' : 'registrado'} com sucesso` });
      setIsPostFormOpen(false);
      setEditingPost(null);
      fetchData();
    }
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from('posted_content')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({ title: 'Erro ao excluir post', variant: 'destructive' });
    } else {
      toast({ title: 'Post excluído' });
      fetchData();
    }
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (filterType === 'all') return !idea.is_posted;
    return !idea.is_posted && idea.content_type === filterType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">POSTAGENS</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas ideias e histórico de posts
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Posts este Mês"
          value={stats.postsThisMonth}
          icon={<FileText className="w-6 h-6" />}
        />
        <MetricCard
          title="Posts esta Semana"
          value={stats.postsThisWeek}
          icon={<Calendar className="w-6 h-6" />}
        />
        <MetricCard
          title="Ideias não Postadas"
          value={stats.unpostedIdeas}
          icon={<Lightbulb className="w-6 h-6" />}
        />
      </div>

      <Tabs defaultValue="ideas" className="w-full">
        <TabsList>
          <TabsTrigger value="ideas">Ideias de Postagens</TabsTrigger>
          <TabsTrigger value="history">Histórico de Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="reels">Reels</SelectItem>
                <SelectItem value="feed">Feed</SelectItem>
                <SelectItem value="story">Story</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateIdea}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Ideia
            </Button>
          </div>

          {filteredIdeas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma ideia cadastrada. Comece criando uma nova!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((idea) => (
                <Card key={idea.id} className="card-hover relative overflow-hidden group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-white',
                            contentTypeColors[idea.content_type]
                          )}
                        >
                          {contentTypeIcons[idea.content_type]}
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {idea.content_type}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-medium text-foreground mb-2">{idea.title}</h3>
                    {idea.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {idea.description}
                      </p>
                    )}
                    {idea.reference_link && (
                      <a
                        href={idea.reference_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mb-3"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver referência
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mb-4">
                      Criada em {format(new Date(idea.created_at), 'dd/MM/yyyy')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openMarkAsPostedDialog(idea)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Postado
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditIdea(idea)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedIdea(idea);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleCreatePost}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Post
            </Button>
          </div>

          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum post registrado ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id} className="group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0',
                        contentTypeColors[post.content_type]
                      )}
                    >
                      {contentTypeIcons[post.content_type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{post.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="capitalize text-xs">
                          {post.content_type}
                        </Badge>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {post.channel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.posted_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPost(post)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePost(post.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      {post.post_link && (
                        <a
                          href={post.post_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Idea Form Sheet */}
      <Sheet open={isIdeaFormOpen} onOpenChange={setIsIdeaFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-display">
              {editingIdea ? 'EDITAR IDEIA' : 'NOVA IDEIA'}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmitIdea} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label>Tipo de Conteúdo</Label>
              <Select
                value={ideaForm.content_type}
                onValueChange={(value) =>
                  setIdeaForm({ ...ideaForm, content_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reels">Reels</SelectItem>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={ideaForm.title}
                onChange={(e) =>
                  setIdeaForm({ ...ideaForm, title: e.target.value })
                }
                placeholder="Título da ideia"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Link de Referência</Label>
              <Input
                value={ideaForm.reference_link}
                onChange={(e) =>
                  setIdeaForm({ ...ideaForm, reference_link: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={ideaForm.description}
                onChange={(e) =>
                  setIdeaForm({ ...ideaForm, description: e.target.value })
                }
                placeholder="Detalhes da ideia..."
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : editingIdea ? 'Atualizar' : 'Criar Ideia'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Post Form Sheet */}
      <Sheet open={isPostFormOpen} onOpenChange={setIsPostFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-display">
              {editingPost ? 'EDITAR POST' : 'REGISTRAR POST'}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmitPost} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label>Tipo de Conteúdo</Label>
              <Select
                value={postForm.content_type}
                onValueChange={(value) =>
                  setPostForm({ ...postForm, content_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reels">Reels</SelectItem>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={postForm.title}
                onChange={(e) =>
                  setPostForm({ ...postForm, title: e.target.value })
                }
                placeholder="Título do post"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Link do Post *</Label>
              <Input
                value={postForm.post_link}
                onChange={(e) =>
                  setPostForm({ ...postForm, post_link: e.target.value })
                }
                placeholder="https://..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Canal</Label>
              <Select
                value={postForm.channel}
                onValueChange={(value) =>
                  setPostForm({ ...postForm, channel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Publicação</Label>
              <Input
                type="date"
                value={postForm.posted_date}
                onChange={(e) =>
                  setPostForm({ ...postForm, posted_date: e.target.value })
                }
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : editingPost ? 'Atualizar Post' : 'Registrar Post'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Mark as Posted Dialog */}
      <Dialog open={isMarkPostedDialogOpen} onOpenChange={setIsMarkPostedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Registrar Post
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Informe o link onde o conteúdo foi postado:
            </p>
            <div className="space-y-2">
              <Label>Link do Post *</Label>
              <Input
                value={markPostedLink}
                onChange={(e) => setMarkPostedLink(e.target.value)}
                placeholder="https://instagram.com/p/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select
                value={markPostedChannel}
                onValueChange={setMarkPostedChannel}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkPostedDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarkAsPosted} disabled={loading}>
              {loading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza que deseja excluir esta ideia? Esta ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteIdea}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}