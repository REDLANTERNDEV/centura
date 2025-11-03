'use client';
/* eslint-disable no-console */

/**
 * Ayarlar Sayfası - Profesyonel ERP/CRM Ayarlar Yönetimi
 * Sektör standardı çoklu sekme ayarlar arayüzü
 * Salesforce, HubSpot, Linear, Notion desenlerini takip eder
 */

import { useState, useEffect } from 'react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import {
  Loader2,
  User,
  Building2,
  Users,
  Shield,
  Save,
  Monitor,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { selectedOrganization } = useOrganization();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    id: 0,
    name: '',
    email: '',
    created_at: '',
    updated_at: '',
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Organization State
  const [orgSettings, setOrgSettings] = useState({
    org_id: 0,
    org_name: '',
    industry: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'Turkey',
    tax_number: '',
    userRole: '',
  });

  // Team Members State
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SETTINGS.PROFILE);
      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (error: any) {
      console.error('Kullanıcı profili yüklenemedi:', error);
      toast.error('Kullanıcı profili yüklenemedi');
    }
  };

  // Fetch organization settings
  const fetchOrgSettings = async () => {
    if (!selectedOrganization?.org_id) return;

    try {
      const response = await apiClient.get(
        API_ENDPOINTS.SETTINGS.ORGANIZATION(
          selectedOrganization.org_id.toString()
        )
      );
      if (response.data.success) {
        const data = response.data.data;
        setOrgSettings({
          org_id: data.org_id || 0,
          org_name: data.org_name || '',
          industry: data.industry || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || 'Turkey',
          tax_number: data.tax_number || '',
          userRole: data.userRole || '',
        });
      }
    } catch (error: any) {
      console.error('Organizasyon ayarları yüklenemedi:', error);
      toast.error('Organizasyon ayarları yüklenemedi');
    }
  };

  // Fetch team members
  const fetchTeamMembers = async () => {
    if (!selectedOrganization?.org_id) return;

    try {
      const response = await apiClient.get(
        API_ENDPOINTS.SETTINGS.ORGANIZATION_TEAM(
          selectedOrganization.org_id.toString()
        )
      );
      if (response.data.success) {
        setTeamMembers(response.data.data.team || []);
      }
    } catch (error: any) {
      console.error('Ekip üyeleri yüklenemedi:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUserProfile(),
        fetchOrgSettings(),
        fetchTeamMembers(),
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [selectedOrganization?.org_id]);

  // Update user profile
  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.put(API_ENDPOINTS.SETTINGS.PROFILE, {
        name: userProfile.name,
        email: userProfile.email,
      });

      if (response.data.success) {
        toast.success('Profil başarıyla güncellendi');
        await fetchUserProfile();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Profil güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  // Update password
  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.put(API_ENDPOINTS.SETTINGS.PASSWORD, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        toast.success('Şifre güncellendi. Lütfen tekrar giriş yapın.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          globalThis.window.location.href = '/auth/login';
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Şifre güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  // Update organization settings
  const handleUpdateOrganization = async () => {
    if (!selectedOrganization?.org_id) return;

    setIsSaving(true);
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.SETTINGS.ORGANIZATION(
          selectedOrganization.org_id.toString()
        ),
        {
          org_name: orgSettings.org_name,
          industry: orgSettings.industry,
          phone: orgSettings.phone,
          email: orgSettings.email,
          address: orgSettings.address,
          city: orgSettings.city,
          country: orgSettings.country,
          tax_number: orgSettings.tax_number,
        }
      );

      if (response.data.success) {
        toast.success('Organizasyon ayarları güncellendi');
        await fetchOrgSettings();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Organizasyon ayarları güncellenemedi'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'org_owner':
        return 'default';
      case 'org_admin':
        return 'secondary';
      case 'manager':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Role display name
  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      org_owner: 'Sahip',
      org_admin: 'Yönetici',
      manager: 'Müdür',
      user: 'Kullanıcı',
      viewer: 'İzleyici',
    };
    return roleNames[role] || role;
  };

  // Update user role
  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    if (!selectedOrganization?.org_id) return;

    try {
      const response = await apiClient.put(
        API_ENDPOINTS.SETTINGS.UPDATE_USER_ROLE(
          selectedOrganization.org_id.toString(),
          userId.toString()
        ),
        { role: newRole }
      );

      if (response.data.success) {
        toast.success('Kullanıcı rolü güncellendi');
        await fetchTeamMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Rol güncellenemedi');
    }
  };

  // Update user status
  const handleUpdateUserStatus = async (userId: number, isActive: boolean) => {
    if (!selectedOrganization?.org_id) return;

    try {
      const response = await apiClient.put(
        API_ENDPOINTS.SETTINGS.UPDATE_USER_STATUS(
          selectedOrganization.org_id.toString(),
          userId.toString()
        ),
        { is_active: isActive }
      );

      if (response.data.success) {
        toast.success(
          `Kullanıcı ${isActive ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`
        );
        await fetchTeamMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Durum güncellenemedi');
    }
  };

  // Remove user from organization
  const handleRemoveUser = async (userId: number, userName: string) => {
    if (!selectedOrganization?.org_id) return;

    if (
      !confirm(
        `${userName} kullanıcısını organizasyondan çıkarmak istediğinizden emin misiniz?`
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.SETTINGS.REMOVE_USER(
          selectedOrganization.org_id.toString(),
          userId.toString()
        )
      );

      if (response.data.success) {
        toast.success('Kullanıcı organizasyondan çıkarıldı');
        await fetchTeamMembers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kullanıcı çıkarılamadı');
    }
  };

  // Check if current user can manage users
  const canManageUsers = () => {
    const roleHierarchy: Record<string, number> = {
      org_owner: 80,
      org_admin: 60,
      manager: 40,
      user: 20,
      viewer: 10,
    };
    return roleHierarchy[orgSettings.userRole] >= roleHierarchy.org_admin;
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        <span className='ml-2 text-muted-foreground'>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Ayarlar</h1>
        <p className='text-muted-foreground mt-2'>
          Hesap ve organizasyon ayarlarınızı yönetin
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='profile' className='flex items-center gap-2'>
            <User className='h-4 w-4' />
            Profil
          </TabsTrigger>
          <TabsTrigger value='appearance' className='flex items-center gap-2'>
            <Palette className='h-4 w-4' />
            Görünüm
          </TabsTrigger>
          <TabsTrigger value='security' className='flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger
            value='organization'
            className='flex items-center gap-2'
            disabled={!selectedOrganization}
          >
            <Building2 className='h-4 w-4' />
            Organizasyon
          </TabsTrigger>
          <TabsTrigger
            value='team'
            className='flex items-center gap-2'
            disabled={!selectedOrganization}
          >
            <Users className='h-4 w-4' />
            Ekip
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value='profile' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Kişisel Bilgiler</CardTitle>
              <CardDescription>
                Kişisel hesap bilgilerinizi güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Ad Soyad</Label>
                <Input
                  id='name'
                  value={userProfile.name}
                  onChange={e =>
                    setUserProfile({ ...userProfile, name: e.target.value })
                  }
                  placeholder='Ahmet Yılmaz'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>E-posta Adresi</Label>
                <Input
                  id='email'
                  type='email'
                  value={userProfile.email}
                  onChange={e =>
                    setUserProfile({ ...userProfile, email: e.target.value })
                  }
                  placeholder='ahmet@example.com'
                />
                <p className='text-xs text-muted-foreground'>
                  E-posta adresiniz giriş ve bildirimler için kullanılır
                </p>
              </div>

              <Separator />

              <div className='flex justify-between items-center'>
                <div className='text-sm text-muted-foreground'>
                  Hesap oluşturulma:{' '}
                  {new Date(userProfile.created_at).toLocaleDateString('tr-TR')}
                </div>
                <Button onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value='appearance' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>
                Uygulamanın görünümünü özelleştirin
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Renk Teması</Label>
                <div className='grid grid-cols-3 gap-3'>
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className='flex items-center gap-2 justify-start'
                    onClick={() => setTheme('light')}
                  >
                    <Sun className='h-4 w-4' />
                    Açık
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className='flex items-center gap-2 justify-start'
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className='h-4 w-4' />
                    Koyu
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className='flex items-center gap-2 justify-start'
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className='h-4 w-4' />
                    Sistem
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Sistem teması, cihazınızın ayarlarını kullanır
                </p>
              </div>

              <Separator />

              <div className='text-sm text-muted-foreground'>
                <p className='font-medium mb-2'>Tema Hakkında:</p>
                <ul className='space-y-1 ml-4 list-disc'>
                  <li>Açık tema: Aydınlık ortamlar için idealdir</li>
                  <li>Koyu tema: Gece çalışması ve göz yorgunluğunu azaltır</li>
                  <li>
                    Sistem teması: Cihazınızın ayarlarını otomatik olarak
                    kullanır
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value='security' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>
                Hesabınızı güvende tutmak için şifrenizi güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='currentPassword'>Mevcut Şifre</Label>
                <Input
                  id='currentPassword'
                  type='password'
                  value={passwordData.currentPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder='Mevcut şifrenizi girin'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='newPassword'>Yeni Şifre</Label>
                <Input
                  id='newPassword'
                  type='password'
                  value={passwordData.newPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder='Yeni şifrenizi girin'
                />
                <p className='text-xs text-muted-foreground'>
                  Minimum 8 karakter
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Yeni Şifre (Tekrar)</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={passwordData.confirmPassword}
                  onChange={e =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder='Yeni şifrenizi tekrar girin'
                />
              </div>

              <Separator />

              <div className='flex justify-end'>
                <Button onClick={handleUpdatePassword} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Şifreyi Güncelle
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Bilgileri</CardTitle>
              <CardDescription>
                Hesabınızla ilgili önemli güvenlik bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2 text-sm text-muted-foreground'>
              <p>
                • Şifrenizi değiştirdiğinizde tüm cihazlardan çıkış yapılacaktır
              </p>
              <p>
                • Şifre güvenliği için endüstri standardı Argon2 şifreleme
                kullanılır
              </p>
              <p>• Şifrenizi asla kimseyle paylaşmayın</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value='organization' className='space-y-4'>
          {selectedOrganization ? (
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle>Organizasyon Bilgileri</CardTitle>
                    <CardDescription>
                      Organizasyon detaylarınızı yönetin
                    </CardDescription>
                  </div>
                  <Badge variant={getRoleBadgeVariant(orgSettings.userRole)}>
                    {getRoleDisplayName(orgSettings.userRole)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='org_name'>Organizasyon Adı *</Label>
                    <Input
                      id='org_name'
                      value={orgSettings.org_name}
                      onChange={e =>
                        setOrgSettings({
                          ...orgSettings,
                          org_name: e.target.value,
                        })
                      }
                      placeholder='Acme Şirketi'
                      disabled={
                        !['org_owner', 'org_admin'].includes(
                          orgSettings.userRole
                        )
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='industry'>Sektör</Label>
                    <Select
                      value={orgSettings.industry}
                      onValueChange={value =>
                        setOrgSettings({ ...orgSettings, industry: value })
                      }
                      disabled={
                        !['org_owner', 'org_admin'].includes(
                          orgSettings.userRole
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Sektör seçin' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Technology'>Teknoloji</SelectItem>
                        <SelectItem value='Manufacturing'>İmalat</SelectItem>
                        <SelectItem value='Retail'>Perakende</SelectItem>
                        <SelectItem value='Healthcare'>Sağlık</SelectItem>
                        <SelectItem value='Finance'>Finans</SelectItem>
                        <SelectItem value='Education'>Eğitim</SelectItem>
                        <SelectItem value='Real Estate'>Gayrimenkul</SelectItem>
                        <SelectItem value='Services'>Hizmetler</SelectItem>
                        <SelectItem value='Other'>Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Telefon Numarası</Label>
                    <Input
                      id='phone'
                      value={orgSettings.phone}
                      onChange={e =>
                        setOrgSettings({
                          ...orgSettings,
                          phone: e.target.value,
                        })
                      }
                      placeholder='+90 212 555 0001'
                      disabled={
                        !['org_owner', 'org_admin'].includes(
                          orgSettings.userRole
                        )
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='org_email'>E-posta</Label>
                    <Input
                      id='org_email'
                      type='email'
                      value={orgSettings.email}
                      onChange={e =>
                        setOrgSettings({
                          ...orgSettings,
                          email: e.target.value,
                        })
                      }
                      placeholder='iletisim@acme.com'
                      disabled={
                        !['org_owner', 'org_admin'].includes(
                          orgSettings.userRole
                        )
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='address'>Adres</Label>
                  <Textarea
                    id='address'
                    value={orgSettings.address}
                    onChange={e =>
                      setOrgSettings({
                        ...orgSettings,
                        address: e.target.value,
                      })
                    }
                    placeholder='Sokak adresi, bina, kat...'
                    rows={3}
                    disabled={
                      !['org_owner', 'org_admin'].includes(orgSettings.userRole)
                    }
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='city'>Şehir</Label>
                    <Input
                      id='city'
                      value={orgSettings.city}
                      onChange={e =>
                        setOrgSettings({ ...orgSettings, city: e.target.value })
                      }
                      placeholder='İstanbul'
                      disabled={
                        !['org_owner', 'org_admin'].includes(
                          orgSettings.userRole
                        )
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='country'>Ülke</Label>
                    <Input
                      id='country'
                      value={orgSettings.country}
                      onChange={e =>
                        setOrgSettings({
                          ...orgSettings,
                          country: e.target.value,
                        })
                      }
                      placeholder='Türkiye'
                      disabled={
                        !['org_owner', 'org_admin'].includes(
                          orgSettings.userRole
                        )
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='tax_number'>Vergi Numarası</Label>
                  <Input
                    id='tax_number'
                    value={orgSettings.tax_number}
                    onChange={e =>
                      setOrgSettings({
                        ...orgSettings,
                        tax_number: e.target.value,
                      })
                    }
                    placeholder='1234567890'
                    disabled={
                      !['org_owner', 'org_admin'].includes(orgSettings.userRole)
                    }
                  />
                </div>

                <Separator />

                <div className='flex justify-end'>
                  <Button
                    onClick={handleUpdateOrganization}
                    disabled={
                      isSaving ||
                      !['org_owner', 'org_admin'].includes(orgSettings.userRole)
                    }
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className='mr-2 h-4 w-4' />
                        Değişiklikleri Kaydet
                      </>
                    )}
                  </Button>
                </div>

                {!['org_owner', 'org_admin'].includes(orgSettings.userRole) && (
                  <p className='text-sm text-muted-foreground text-center'>
                    Sadece organizasyon sahipleri ve yöneticileri ayarları
                    değiştirebilir
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='pt-6'>
                <p className='text-center text-muted-foreground'>
                  Ayarları görüntülemek için lütfen bir organizasyon seçin
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value='team' className='space-y-4'>
          {selectedOrganization ? (
            <Card>
              <CardHeader>
                <CardTitle>Ekip Üyeleri</CardTitle>
                <CardDescription>
                  Organizasyonunuzun ekip üyelerini görüntüleyin ve yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamMembers.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>İsim</TableHead>
                          <TableHead>E-posta</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Katılma Tarihi</TableHead>
                          {canManageUsers() && (
                            <TableHead className='text-right'>
                              İşlemler
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMembers.map(member => (
                          <TableRow key={member.id}>
                            <TableCell className='font-medium'>
                              {member.name}
                            </TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>
                              {canManageUsers() &&
                              member.id !== userProfile.id &&
                              !(
                                orgSettings.userRole === 'org_admin' &&
                                member.role === 'org_owner'
                              ) ? (
                                <Select
                                  value={member.role}
                                  onValueChange={value =>
                                    handleUpdateUserRole(member.id, value)
                                  }
                                >
                                  <SelectTrigger className='w-[140px]'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {orgSettings.userRole === 'org_owner' && (
                                      <SelectItem value='org_owner'>
                                        Sahip
                                      </SelectItem>
                                    )}
                                    <SelectItem value='org_admin'>
                                      Yönetici
                                    </SelectItem>
                                    <SelectItem value='manager'>
                                      Müdür
                                    </SelectItem>
                                    <SelectItem value='user'>
                                      Kullanıcı
                                    </SelectItem>
                                    <SelectItem value='viewer'>
                                      İzleyici
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge
                                  variant={getRoleBadgeVariant(member.role)}
                                >
                                  {getRoleDisplayName(member.role)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {member.is_active && member.role_active ? (
                                <Badge
                                  variant='outline'
                                  className='bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
                                >
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge
                                  variant='outline'
                                  className='bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                                >
                                  Pasif
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className='text-muted-foreground'>
                              {new Date(member.assigned_at).toLocaleDateString(
                                'tr-TR'
                              )}
                            </TableCell>
                            {canManageUsers() && (
                              <TableCell className='text-right space-x-2'>
                                {member.id !== userProfile.id &&
                                  !(
                                    orgSettings.userRole === 'org_admin' &&
                                    member.role === 'org_owner'
                                  ) && (
                                    <>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant='outline'
                                              size='sm'
                                              onClick={() =>
                                                handleUpdateUserStatus(
                                                  member.id,
                                                  !member.role_active
                                                )
                                              }
                                            >
                                              {member.role_active
                                                ? 'Pasifleştir'
                                                : 'Aktifleştir'}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className='max-w-xs text-sm'>
                                              {member.role_active
                                                ? 'Kullanıcının erişimini geçici olarak kapat (kullanıcı giriş yapamaz, veriler korunur)'
                                                : 'Kullanıcının erişimini tekrar aç'}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant='destructive'
                                              size='sm'
                                              onClick={() =>
                                                handleRemoveUser(
                                                  member.id,
                                                  member.name
                                                )
                                              }
                                            >
                                              Çıkar
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className='max-w-xs text-sm'>
                                              Kullanıcıyı organizasyondan
                                              tamamen çıkar (geri alınamaz)
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </>
                                  )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {canManageUsers() && (
                      <div className='mt-4 text-sm text-muted-foreground'>
                        <p>
                          • Sadece organizasyon sahipleri ve yöneticileri
                          kullanıcı rollerini değiştirebilir
                        </p>
                        <p>• Kendi rolünüzü değiştiremezsiniz</p>
                        {orgSettings.userRole === 'org_admin' && (
                          <p>
                            • Yöneticiler, sahip rolündeki kullanıcıları
                            yönetemez
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className='text-center text-muted-foreground py-8'>
                    Ekip üyesi bulunamadı
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='pt-6'>
                <p className='text-center text-muted-foreground'>
                  Ekip üyelerini görüntülemek için lütfen bir organizasyon seçin
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
