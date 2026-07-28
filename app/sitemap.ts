import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

type PublicProject = {
  slug: string;
  published_at?: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1
    },
    {
      url: `${siteUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${siteUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${siteUrl}/payment`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6
    }
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return staticRoutes;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data } = await supabase.rpc('get_public_project_cards');

  const projectRoutes: MetadataRoute.Sitemap = ((data || []) as PublicProject[]).map((project) => ({
    url: `${siteUrl}/project/${project.slug}`,
    lastModified: project.published_at ? new Date(project.published_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8
  }));

  return [...staticRoutes, ...projectRoutes];
}
