class GestorLivros {
    constructor() {
        this.baseUrl = '/api';
        this.currentSection = 'books';
        this.books = [];
        this.authors = [];
        this.reviews = [];
        this.init();
    }

    safeText(value, fallback = '') {
        return (value !== undefined && value !== null && value !== 'undefined') ? value : fallback;
    }

    async init() {
        lucide.createIcons();
        await this.loadData();
        this.setupEventListeners();
        this.renderBooks();
        await this.loadStatistics();
    }

    async loadData() {
        try {
            this.showLoading('Carregando dados...');
            await Promise.all([
                this.loadBooks(),
                this.loadAuthors(),
                this.loadReviews()
            ]);
            this.hideLoading();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.hideLoading();
            this.showNotification('Erro ao carregar dados: ' + error.message, 'error');
        }
    }

    async loadBooks() {
        try {
            const response = await fetch(`${this.baseUrl}/livros`);
            if (response.ok) {
                this.books = await response.json();
            }
        } catch (error) {
            console.error('Erro ao carregar livros:', error);
        }
    }

    async loadAuthors() {
        try {
            const response = await fetch(`${this.baseUrl}/autores`);
            if (response.ok) {
                this.authors = await response.json();
                this.populateAuthorSelect();
            }
        } catch (error) {
            console.error('Erro ao carregar autores:', error);
        }
    }

    async loadReviews() {
        try {
            const response = await fetch(`${this.baseUrl}/avaliacoes`);
            if (response.ok) {
                this.reviews = await response.json();
            }
        } catch (error) {
            console.error('Erro ao carregar avaliações:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('book-form').addEventListener('submit', (e) => this.handleBookSubmit(e));
        document.getElementById('author-form').addEventListener('submit', (e) => this.handleAuthorSubmit(e));
        document.getElementById('review-form').addEventListener('submit', (e) => this.handleReviewSubmit(e));

        document.getElementById('search-books').addEventListener('input', (e) => this.searchBooks(e.target.value));
        document.getElementById('filter-genre').addEventListener('change', (e) => this.filterByGenre(e.target.value));
        document.getElementById('sort-books').addEventListener('change', (e) => this.sortBooks(e.target.value));
    }

    async handleBookSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const bookData = Object.fromEntries(formData.entries());

        if (!bookData.titulo || !bookData.autorId || !bookData.genero) {
            this.showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        try {
            this.showLoading('Adicionando livro...');
            const response = await fetch(`${this.baseUrl}/livros`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });

            this.hideLoading();

            if (response.ok) {
                this.showNotification('Livro adicionado com sucesso!', 'success');
                e.target.reset();
                this.closeModal('book-modal');
                await this.loadBooks();
                this.renderBooks();
                await this.loadStatistics();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.erro || 'Erro ao adicionar livro');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification(error.message, 'error');
        }
    }

    async handleAuthorSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const authorData = Object.fromEntries(formData.entries());

        try {
            this.showLoading('Adicionando autor...');
            const response = await fetch(`${this.baseUrl}/autores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authorData)
            });

            this.hideLoading();

            if (response.ok) {
                this.showNotification('Autor adicionado com sucesso!', 'success');
                e.target.reset();
                this.closeModal('author-modal');
                await this.loadAuthors();
                this.renderAuthors();
            } else {
                throw new Error('Erro ao adicionar autor');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Erro ao adicionar autor', 'error');
        }
    }

    async handleReviewSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const reviewData = Object.fromEntries(formData.entries());

        if (!reviewData.pontuacao || !reviewData.reviewer) {
            this.showNotification('Por favor, preencha pontuação e nome do avaliador', 'error');
            return;
        }

        try {
            this.showLoading('Adicionando avaliação...');
            const response = await fetch(`${this.baseUrl}/avaliacoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });

            this.hideLoading();

            if (response.ok) {
                this.showNotification('Avaliação adicionada com sucesso!', 'success');
                e.target.reset();
                this.closeModal('review-modal');
                await this.loadReviews();
                await this.loadBooks();
                await this.loadStatistics();
                this.renderBooks();
                this.renderReviews();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.erro || 'Erro ao adicionar avaliação');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification(error.message, 'error');
        }
    }

    renderBooks() {
        const grid = document.getElementById('books-grid');
        
        document.getElementById('book-count').innerHTML = `${this.books.length}`;
        
        if (this.books.length === 0) {
            grid.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; padding: 2rem; text-align: center;">
                    <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
                        <i data-lucide="book-x" class="text-muted-foreground" style="width: 4rem; height: 4rem;"></i>
                    </div>
                    <h3 class="text-foreground" style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Nenhum livro encontrado</h3>
                    <p class="text-muted-foreground" style="margin-bottom: 1rem;">Comece por adicionar o seu primeiro livro à biblioteca</p>
                    <button onclick="app.openModal('book-modal')" class="btn btn-primary btn-md">
                        <i data-lucide="plus" class="h-4 w-4" style="margin-right: 0.5rem;"></i>
                        Adicionar Primeiro Livro
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        grid.innerHTML = this.books.map(book => `
            <div class="card" style="padding: 1.5rem; transition: box-shadow 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h3 class="text-foreground" style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem;" title="${book.titulo}">${book.titulo}</h3>
                        <p class="text-muted-foreground" style="font-size: 0.875rem; margin-bottom: 0.5rem;">
                            por ${this.safeText(book.nome_autor || book.nomeAutor, 'Autor Desconhecido')}
                        </p>
                    </div>
                    <div style="display: flex; align-items: center;">
                        ${this.renderStars(book.media_avaliacoes || 0)}
                    </div>
                </div>
                
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                    <span class="badge badge-secondary">
                        ${this.safeText(book.genero, 'Sem Género')}
                    </span>
                    <span class="badge badge-outline">
                        ${this.safeText(book.anoPublicacao || book.ano_publicacao, 'Sem Ano')}
                    </span>
                </div>
                
                ${(book.descricao || book.resumo) ? `<p class="text-muted-foreground line-clamp-3" style="font-size: 0.875rem; margin-bottom: 1rem;">${book.descricao || book.resumo}</p>` : ''}
                
                <div style="border-top: 1px solid hsl(214.3 31.8% 91.4%); padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <span class="text-muted-foreground" style="font-size: 0.75rem;">
                            ${book.total_avaliacoes || 0} avaliações
                        </span>
                        <span class="text-muted-foreground" style="font-size: 0.75rem;">
                            ID: ${book._id.slice(-6).toUpperCase()}
                        </span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="app.openReviewModal('${book._id}')" class="btn btn-outline btn-sm" style="flex: 1;" title="Adicionar Avaliação">
                            <i data-lucide="star" class="h-4 w-4" style="margin-right: 0.25rem;"></i>
                            Avaliar
                        </button>
                        <button onclick="app.showRecommendations('${book._id}')" class="btn btn-outline btn-sm" style="flex: 1;" title="Livros Similares">
                            <i data-lucide="search" class="h-4 w-4" style="margin-right: 0.25rem;"></i>
                            Similares
                        </button>
                        <button onclick="app.deleteBook('${book._id}')" class="btn btn-destructive btn-sm" title="Eliminar Livro">
                            <i data-lucide="trash-2" class="h-4 w-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        lucide.createIcons();
        this.updateGenreFilter();
    }

    renderAuthors() {
        const grid = document.getElementById('authors-grid');
        
        document.getElementById('author-count').innerHTML = `${this.authors.length}`;
        
        if (this.authors.length === 0) {
            grid.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; padding: 2rem; text-align: center;">
                    <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
                        <i data-lucide="user-x" class="text-muted-foreground" style="width: 4rem; height: 4rem;"></i>
                    </div>
                    <h3 class="text-foreground" style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Nenhum autor encontrado</h3>
                    <p class="text-muted-foreground" style="margin-bottom: 1rem;">Adicione autores para começar a organizar os seus livros</p>
                    <button onclick="app.openModal('author-modal')" class="btn btn-primary btn-md">
                        <i data-lucide="user-plus" class="h-4 w-4" style="margin-right: 0.5rem;"></i>
                        Adicionar Primeiro Autor
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        grid.innerHTML = this.authors.map(author => `
            <div class="card" style="padding: 1.5rem; transition: box-shadow 0.2s;">
                <div style="margin-bottom: 1rem;">
                    <div>
                        <h3 class="text-foreground" style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem;">${author.nome}</h3>
                        <p class="text-muted-foreground" style="font-size: 0.875rem;">Nacionalidade: ${author.nacionalidade}</p>
                        ${author.anoNascimento ? `<p class="text-muted-foreground" style="font-size: 0.875rem;">Nascido em: ${author.anoNascimento}</p>` : ''}
                    </div>
                </div>
                
                ${author.biografia ? `<p class="text-muted-foreground line-clamp-3" style="font-size: 0.875rem; margin-bottom: 1rem;">${author.biografia}</p>` : ''}
                
                <div style="border-top: 1px solid hsl(214.3 31.8% 91.4%); padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <span class="text-muted-foreground" style="font-size: 0.875rem;">
                            ${author.total_livros || 0} livros
                        </span>
                        <span class="text-muted-foreground" style="font-size: 0.75rem;">
                            ID: ${author._id.slice(-6).toUpperCase()}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: flex-end;">
                        <button onclick="app.deleteAuthor('${author._id}')" class="btn btn-destructive btn-sm">
                            <i data-lucide="trash-2" class="h-4 w-4" style="margin-right: 0.25rem;"></i>
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        lucide.createIcons();
    }

    renderReviews() {
        const list = document.getElementById('reviews-list');
        
        if (this.reviews.length === 0) {
            list.innerHTML = `
                <div class="card" style="padding: 2rem; text-align: center;">
                    <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
                        <i data-lucide="message-square" class="text-muted-foreground" style="width: 4rem; height: 4rem;"></i>
                    </div>
                    <h3 class="text-foreground" style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Nenhuma avaliação encontrada</h3>
                    <p class="text-muted-foreground">As avaliações aparecerão aqui quando forem adicionadas</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        list.innerHTML = this.reviews.slice(0, 10).map(review => `
            <div class="card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                        <h4 class="text-foreground" style="font-weight: 600;">${review.titulo_livro || 'Livro'}</h4>
                        <p class="text-muted-foreground" style="font-size: 0.875rem;">por ${review.reviewer}</p>
                    </div>
                    <div style="display: flex; align-items: center;">
                        ${this.renderStars(review.pontuacao)}
                    </div>
                </div>
                ${review.comentario ? `<p class="text-foreground" style="margin-bottom: 0.75rem;">${review.comentario}</p>` : ''}
                <p class="text-muted-foreground" style="font-size: 0.875rem;">${new Date(review.data_avaliacao).toLocaleDateString('pt-PT')}</p>
            </div>
        `).join('');
        
        lucide.createIcons();
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return `
            <div class="flex items-center">
                ${Array(fullStars).fill('<i data-lucide="star" class="h-4 w-4 text-yellow-400 fill-yellow-400"></i>').join('')}
                ${hasHalfStar ? '<i data-lucide="star-half" class="h-4 w-4 text-yellow-400 fill-yellow-400"></i>' : ''}
                ${Array(emptyStars).fill('<i data-lucide="star" class="h-4 w-4 text-gray-300"></i>').join('')}
                <span class="ml-1 text-sm text-muted-foreground">${rating.toFixed(1)}</span>
            </div>
        `;
    }

    populateAuthorSelect() {
        const select = document.querySelector('select[name="autorId"]');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecionar autor</option>';
        
        this.authors.forEach(author => {
            select.innerHTML += `<option value="${author._id}">${author.nome}</option>`;
        });
    }

    updateGenreFilter() {
        const genres = [...new Set(this.books.map(book => book.genero))];
        const select = document.getElementById('filter-genre');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Todos os géneros</option>';
        genres.forEach(genre => {
            select.innerHTML += `<option value="${genre}" ${currentValue === genre ? 'selected' : ''}>${genre}</option>`;
        });
    }

    searchBooks(query) {
        const filtered = this.books.filter(book => 
            book.titulo.toLowerCase().includes(query.toLowerCase()) ||
            (book.nome_autor && book.nome_autor.toLowerCase().includes(query.toLowerCase())) ||
            book.genero.toLowerCase().includes(query.toLowerCase())
        );
        this.renderFilteredBooks(filtered);
    }

    filterByGenre(genre) {
        const filtered = genre ? this.books.filter(book => book.genero === genre) : this.books;
        this.renderFilteredBooks(filtered);
    }

    sortBooks(criteria) {
        let sorted = [...this.books];
        
        switch (criteria) {
            case 'title':
                sorted.sort((a, b) => a.titulo.localeCompare(b.titulo));
                break;
            case 'rating':
                sorted.sort((a, b) => (b.media_avaliacoes || 0) - (a.media_avaliacoes || 0));
                break;
            case 'year':
                sorted.sort((a, b) => (b.anoPublicacao || b.ano_publicacao) - (a.anoPublicacao || a.ano_publicacao));
                break;
        }
        
        this.books = sorted;
        this.renderBooks();
    }

    renderFilteredBooks(books) {
        const originalBooks = this.books;
        this.books = books;
        this.renderBooks();
        this.books = originalBooks;
    }

    async deleteBook(bookId) {
        if (!confirm('Tem certeza que deseja eliminar este livro?')) return;
        
        try {
            this.showLoading('Eliminando livro...');
            const response = await fetch(`${this.baseUrl}/livros/${bookId}`, {
                method: 'DELETE'
            });
            
            this.hideLoading();
            
            if (response.ok) {
                this.showNotification('Livro eliminado com sucesso!', 'success');
                await this.loadBooks();
                this.renderBooks();
                await this.loadStatistics();
            } else {
                throw new Error('Erro ao eliminar livro');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Erro ao eliminar livro', 'error');
        }
    }

    async deleteAuthor(authorId) {
        if (!confirm('Tem certeza que deseja eliminar este autor?')) return;
        
        try {
            this.showLoading('Eliminando autor...');
            const response = await fetch(`${this.baseUrl}/autores/${authorId}`, {
                method: 'DELETE'
            });
            
            this.hideLoading();
            
            if (response.ok) {
                this.showNotification('Autor eliminado com sucesso!', 'success');
                await this.loadAuthors();
                this.renderAuthors();
            } else {
                const error = await response.json();
                throw new Error(error.erro || 'Erro ao eliminar autor');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification(error.message, 'error');
        }
    }

    openReviewModal(bookId) {
        document.getElementById('review-book-id').value = bookId;
        
        const book = this.books.find(b => b._id === bookId);
        if (book) {
            const modalTitle = document.querySelector('#review-modal h3');
            modalTitle.textContent = `Avaliar "${book.titulo}"`;
        }
        
        this.openModal('review-modal');
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        
        if (modalId === 'review-modal') {
            const modalTitle = document.querySelector('#review-modal h3');
            if (modalTitle) {
                modalTitle.textContent = 'Adicionar Avaliação';
            }
        }
    }

    async loadStatistics() {
        try {
            const response = await fetch(`${this.baseUrl}/livros/statistics/overview`);
            if (response.ok) {
                this.statistics = await response.json();
                this.renderStatistics();
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    renderStatistics() {
        if (!this.statistics) return;
        
        const overview = document.getElementById('stats-overview');
        overview.innerHTML = `
            <div class="card" style="padding: 1.5rem;">
                <div style="display: flex; align-items: center;">
                    <div style="padding: 0.75rem; background-color: hsl(222.2 47.4% 11.2% / 0.1); border-radius: 0.5rem; margin-right: 1rem;">
                        <i data-lucide="book" style="width: 2rem; height: 2rem; color: hsl(222.2 47.4% 11.2%);"></i>
                    </div>
                    <div>
                        <p class="text-muted-foreground" style="font-size: 0.875rem; font-weight: 500;">Total de Livros</p>
                        <p class="text-foreground" style="font-size: 1.5rem; font-weight: 700;">${this.statistics.overview.totalBooks}</p>
                    </div>
                </div>
            </div>
            <div class="card" style="padding: 1.5rem;">
                <div style="display: flex; align-items: center;">
                    <div style="padding: 0.75rem; background-color: rgb(220 252 231); border-radius: 0.5rem; margin-right: 1rem;">
                        <i data-lucide="tag" style="width: 2rem; height: 2rem; color: rgb(22 163 74);"></i>
                    </div>
                    <div>
                        <p class="text-muted-foreground" style="font-size: 0.875rem; font-weight: 500;">Géneros</p>
                        <p class="text-foreground" style="font-size: 1.5rem; font-weight: 700;">${this.statistics.overview.totalGenres}</p>
                    </div>
                </div>
            </div>
            <div class="card" style="padding: 1.5rem;">
                <div style="display: flex; align-items: center;">
                    <div style="padding: 0.75rem; background-color: rgb(254 249 195); border-radius: 0.5rem; margin-right: 1rem;">
                        <i data-lucide="star" style="width: 2rem; height: 2rem; color: rgb(202 138 4);"></i>
                    </div>
                    <div>
                        <p class="text-muted-foreground" style="font-size: 0.875rem; font-weight: 500;">Avaliação Média</p>
                        <p class="text-foreground" style="font-size: 1.5rem; font-weight: 700;">${this.statistics.overview.averageRating}</p>
                    </div>
                </div>
            </div>
        `;

        // Top rated books
        const topRated = document.getElementById('top-rated-books');
        topRated.innerHTML = this.statistics.topRatedBooks.length === 0 ?
            '<p class="text-muted-foreground text-center py-4">Nenhum livro avaliado ainda</p>' :
            this.statistics.topRatedBooks.map((book, index) => `
                <div class="flex items-center justify-between py-3 ${index !== this.statistics.topRatedBooks.length - 1 ? 'border-b' : ''}">
                    <div>
                        <p class="font-medium text-foreground">${book.titulo}</p>
                        <p class="text-sm text-muted-foreground">${book.nomeAutor}</p>
                    </div>
                    <div class="text-right">
                        <div class="flex items-center">
                            ${this.renderStars(book.avgRating)}
                        </div>
                        <p class="text-xs text-muted-foreground">${book.totalRatings} avaliações</p>
                    </div>
                </div>
            `).join('');

        // Genre distribution
        const genreDistribution = document.getElementById('genre-distribution');
        genreDistribution.innerHTML = this.statistics.genreDistribution.map(genre => `
            <div class="flex justify-between items-center py-2">
                <span class="text-foreground">${genre._id}</span>
                <span class="badge badge-secondary">${genre.count}</span>
            </div>
        `).join('');

        // Recent books
        const recentBooks = document.getElementById('recent-books');
        recentBooks.innerHTML = this.statistics.recentBooks.map(book => `
            <div class="py-3 border-b last:border-b-0">
                <p class="font-medium text-foreground">${book.titulo}</p>
                <p class="text-sm text-muted-foreground">${book.nomeAutor} • ${book.genero}</p>
                <p class="text-xs text-muted-foreground">${new Date(book.criadoEm).toLocaleDateString('pt-PT')}</p>
            </div>
        `).join('');

        // Year distribution
        const yearDistribution = document.getElementById('year-distribution');
        yearDistribution.innerHTML = this.statistics.yearDistribution.map(year => `
            <div class="flex justify-between items-center py-2">
                <span class="text-foreground">${year._id}</span>
                <span class="badge badge-outline">${year.count}</span>
            </div>
        `).join('');

        lucide.createIcons();
    }

    async showRecommendations(bookId) {
        try {
            this.showLoading('Buscando recomendações...');
            const response = await fetch(`${this.baseUrl}/livros/recommendations/${bookId}`);
            this.hideLoading();
            
            if (response.ok) {
                const data = await response.json();
                this.displayRecommendations(data);
            } else {
                throw new Error('Erro ao buscar recomendações');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Erro ao buscar recomendações', 'error');
        }
    }

    displayRecommendations(data) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
            <div class="card max-w-4xl w-full p-6 max-h-96 overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-lg font-semibold text-foreground">Livros Similares</h3>
                        <p class="text-sm text-muted-foreground">Baseado em "${data.targetBook.titulo}" por ${data.targetBook.nomeAutor}</p>
                    </div>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-muted-foreground hover:text-foreground">
                        <i data-lucide="x" class="h-5 w-5"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    ${data.recommendations.length === 0 ? 
                        `<div class="text-center py-8">
                            <i data-lucide="search" class="h-12 w-12 text-muted-foreground mx-auto mb-4"></i>
                            <p class="text-muted-foreground">Nenhuma recomendação encontrada</p>
                            <p class="text-sm text-muted-foreground mt-2">Tente adicionar mais livros do mesmo género ou autor</p>
                        </div>` :
                        data.recommendations.map((book) => `
                            <div class="card p-4">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="flex items-start justify-between mb-2">
                                            <h4 class="font-semibold text-foreground">${book.titulo}</h4>
                                            <span class="badge badge-secondary ml-2">${book.reason}</span>
                                        </div>
                                        <p class="text-sm text-muted-foreground mb-2">por ${book.nomeAutor}</p>
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center space-x-4">
                                                <div class="flex items-center">
                                                    ${this.renderStars(book.avgRating || 0)}
                                                </div>
                                                <span class="text-xs text-muted-foreground">${book.totalRatings || 0} ${(book.totalRatings || 0) === 1 ? 'avaliação' : 'avaliações'}</span>
                                                <span class="badge badge-outline">${book.genero}</span>
                                            </div>
                                            <button onclick="app.openReviewModal('${book._id}'); this.closest('.fixed').remove();" class="btn btn-outline btn-sm">
                                                <i data-lucide="star" class="h-3 w-3 mr-1"></i>Avaliar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                ${data.recommendations.length > 0 ? `
                    <div class="mt-6 pt-4 border-t text-center">
                        <p class="text-xs text-muted-foreground">
                            <i data-lucide="lightbulb" class="h-4 w-4 inline mr-1"></i>
                            Recomendações baseadas em género, autor e avaliações
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        lucide.createIcons();
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    showLoading(message = 'Carregando...') {
        const existingLoading = document.getElementById('app-loading');
        if (existingLoading) {
            existingLoading.remove();
        }

        const loading = document.createElement('div');
        loading.id = 'app-loading';
        loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loading.innerHTML = `
            <div class="card p-6 flex items-center space-x-3">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span class="text-foreground font-medium">${message}</span>
            </div>
        `;
        
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('app-loading');
        if (loading) {
            loading.remove();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-2 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        
        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info';
        notification.innerHTML = `
            <i data-lucide="${icon}" class="h-5 w-5 flex-shrink-0"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        lucide.createIcons();
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Global functions for navigation and modals
function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('inactive');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
    });
    
    event.target.classList.remove('inactive', 'btn-outline');
    event.target.classList.add('active', 'btn-primary');
    
    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    document.getElementById(`${sectionName}-section`).classList.remove('hidden');
    
    // Render appropriate content
    switch (sectionName) {
        case 'books':
            app.renderBooks();
            break;
        case 'authors':
            app.renderAuthors();
            break;
        case 'reviews':
            app.renderReviews();
            break;
        case 'statistics':
            app.renderStatistics();
            break;
    }
    
    app.currentSection = sectionName;
}

function openModal(modalId) {
    app.openModal(modalId);
}

function closeModal(modalId) {
    app.closeModal(modalId);
}

// Initialize the app
const app = new GestorLivros();