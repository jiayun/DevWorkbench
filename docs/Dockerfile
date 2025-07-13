FROM --platform=linux/arm64 ruby:3.1-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    git \
    && gem install bundler jekyll

WORKDIR /site

# Copy Gemfile and install gems
COPY Gemfile* ./
RUN bundle install

# Copy the rest of the site
COPY . .

EXPOSE 4000

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--incremental", "--livereload"]
