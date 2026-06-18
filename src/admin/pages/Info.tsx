import { useState, useEffect } from 'react'
import { api, getMode } from '../services/data'
import { getConfig } from '../services/github'

export function Info() {
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const config = getConfig()
        const [dbRes, settingsRes, searchRes, tagRes] = await Promise.all([
          api.getDb(),
          api.getSettings(),
          api.getSearch(),
          api.getTags(),
        ])
        const db = dbRes?.content || []
        const totalSites = db.reduce((a: number, cat: any) =>
          a + (cat.children || []).reduce((b: number, sub: any) => b + (sub.nav?.length || 0), 0), 0)
        setInfo({
          repo: config ? `${config.owner}/${config.repo}` : '-',
          branch: config?.branch || '-',
          totalCategories: db.length,
          totalSubCategories: db.reduce((a: number, cat: any) => a + (cat.children?.length || 0), 0),
          totalSites,
          totalSearchEngines: searchRes?.content?.length || 0,
          totalTags: tagRes?.content?.length || 0,
          title: settingsRes?.content?.title || '-',
          version: settingsRes?.content?.version || '-',
          lastUpdate: settingsRes?.content?.runtimeDate || '-',
        })
      } catch { }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="admin-loading">加载中...</div>

  return (
    <div>
      <div className="admin-toolbar"><span>系统信息</span></div>

      {info && (
        <div className="admin-info-grid">
          <div className="admin-info-card">
            <div className="admin-info-label">仓库</div>
            <div className="admin-info-value">{info.repo}</div>
          </div>
          <div className="admin-info-card">
            <div className="admin-info-label">分支</div>
            <div className="admin-info-value">{info.branch}</div>
          </div>
          <div className="admin-info-card">
            <div className="admin-info-label">站点标题</div>
            <div className="admin-info-value">{info.title}</div>
          </div>
          <div className="admin-info-card">
            <div className="admin-info-label">版本</div>
            <div className="admin-info-value">{info.version}</div>
          </div>
          <div className="admin-info-card highlight">
            <div className="admin-info-label">收录网站</div>
            <div className="admin-info-value big">{info.totalSites}</div>
          </div>
          <div className="admin-info-card highlight">
            <div className="admin-info-label">一级分类</div>
            <div className="admin-info-value big">{info.totalCategories}</div>
          </div>
          <div className="admin-info-card highlight">
            <div className="admin-info-label">子分类</div>
            <div className="admin-info-value big">{info.totalSubCategories}</div>
          </div>
          <div className="admin-info-card highlight">
            <div className="admin-info-label">搜索引擎</div>
            <div className="admin-info-value big">{info.totalSearchEngines}</div>
          </div>
          <div className="admin-info-card highlight">
            <div className="admin-info-label">标签数量</div>
            <div className="admin-info-value big">{info.totalTags}</div>
          </div>
          <div className="admin-info-card">
            <div className="admin-info-label">最后更新</div>
            <div className="admin-info-value">{info.lastUpdate}</div>
          </div>
        </div>
      )}
    </div>
  )
}
