# 本地預覽 GitHub Pages

由於 macOS 預設的 Ruby 版本較舊，有幾種方式可以預覽網站：

## 方法 1：使用 GitHub Pages 線上預覽
1. 推送 docs 資料夾到 GitHub
2. 在 Repository Settings → Pages 啟用 GitHub Pages
3. 選擇 `/docs` folder 作為來源
4. 網站將在 `https://jiayun.github.io/DevWorkbench` 可用

## 方法 2：使用 Ruby 版本管理器（推薦）

### 安裝 rbenv
```bash
# 安裝 rbenv
brew install rbenv

# 初始化 rbenv
rbenv init

# 添加到 shell profile
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc

# 安裝最新 Ruby
rbenv install 3.1.0
rbenv global 3.1.0

# 重新啟動終端，然後：
cd docs
bundle install
bundle exec jekyll serve
```

### 或使用 RVM
```bash
# 安裝 RVM
\curl -sSL https://get.rvm.io | bash -s stable
source ~/.rvm/scripts/rvm

# 安裝 Ruby
rvm install 3.1.0
rvm use 3.1.0 --default

# 然後：
cd docs
bundle install
bundle exec jekyll serve
```

## 方法 3：使用 Docker（推薦）
```bash
# 使用已提供的 Dockerfile
docker build -t devworkbench-docs .
docker run -p 4000:4000 devworkbench-docs

# 然後訪問 http://localhost:4000
```

**注意：** Dockerfile 已針對 ARM64 (M1/M2 Mac) 優化，解決了平台相容性問題。

## 方法 4：簡單的 HTTP 伺服器
```bash
# 使用 Python 伺服器（僅適用於靜態檔案預覽）
cd docs
python3 -m http.server 8000
# 然後訪問 http://localhost:8000
```

## GitHub Pages 自動部署
GitHub Pages 會自動使用 Jekyll 建置 `/docs` 資料夾中的內容，因此最簡單的方式是直接推送到 GitHub 並使用線上版本。
