```markdown
# GitLearn → AWS Academy Learner Lab — Despliegue 2026

## Arquitectura objetivo
```

```
                 Internet
                    │
               Puerto 80 (HTTP)
                    │
          ┌──────────▼──────────┐
          │  EC2 t3.small       │  Ubuntu 22.04
          │  Ubuntu + Docker    │  Security Group: 22, 80
          │                     │
          │  ┌──────────────┐   │
          │  │ nginx        │   │  Puerto 80 público
          │  │ (frontend)   │   │  - Sirve /dist (Angular build)
          │  │              │   │  - Proxy /api → backend:3000
          │  └─────┬────────┘   │
          │        │            │
          │  ┌─────▼────────┐   │
          │  │ backend      │   │  Puerto 3000 (interno)
          │  │ Node + dist/ │   │
          │  └─────┬────────┘   │
          │        │            │
          │  ┌─────▼────────┐   │
          │  │ mongo        │   │  Puerto 27017 (interno, sin exponer)
          │  │ + EBS volume │   │
          │  └──────────────┘   │
          └─────────────────────┘
```

````

### URL final:
[http://ec2-XX-XX-XX-XX.compute-1.amazonaws.com/](http://ec2-XX-XX-XX-XX.compute-1.amazonaws.com/)

---

## FASE 0 — Preparar el código (en tu PC local)

### 0.1. Crear `backend/Dockerfile.prod`

```dockerfile
# === Build ===
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# === Runtime ===
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
````

### 0.2. Crear `frontend/Dockerfile.prod`

```dockerfile
# === Build Angular ===
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# === Serve con nginx ===
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 0.3. Crear `frontend/nginx.conf`

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # Angular client-side routing — fallback a index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy del API al backend container
  location /api/ {
    proxy_pass http://backend:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
  }

  # Cache estático razonable
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 7d;
    add_header Cache-Control "public, no-transform";
  }
}
```

### 0.4. Crear `backend/.dockerignore` y `frontend/.dockerignore`

Ambos con el mismo contenido:

```
node_modules
dist
.env
.env.local
*.log
.git
.vscode
```

### 0.5. Crear `docker-compose.prod.yml` en la raíz

```yaml
services:
  mongo:
    image: mongo:7
    container_name: gitlearn-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: gitlearn
    volumes:
      - mongo_data:/data/db
    networks:
      - gitlearn-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: gitlearn-backend
    restart: unless-stopped
    env_file:
      - ./backend/.env
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongo:27017/gitlearn
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - gitlearn-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: gitlearn-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - gitlearn-network

volumes:
  mongo_data:
    name: gitlearn-mongo-data

networks:
  gitlearn-network:
    name: gitlearn-network
```

Diferencias respecto al dev: sin `volume mounts` (no hot reload), `Dockerfile.prod`, mongo y backend **SIN** exponer puertos al host (solo accesibles vía red Docker), nginx en :80 es la única puerta de entrada.

### 0.6. Subir el código a GitHub

Tu carpeta no es repo todavía. En PowerShell en `C:\Users\Usuario\Desktop\GitLearn`:

```bash
git init
git add .
git commit -m "Initial commit — pre-deploy"
```

Crea un repo privado en [GitHub](https://github.com/new) (nombre: `gitlearn`). Después:

```bash
git remote add origin https://github.com/<tu-usuario>/gitlearn.git
git branch -M main
git push -u origin main
```

Importante: verifica que `backend/.env` NO está en el commit (ya está gitignoreado). Si por accidente subiste el secret de GitHub OAuth, regenera el secret antes de continuar.

### 0.7. (opcional pero recomendado) Probar local antes de subir

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Abre [http://localhost](http://localhost). Si funciona localmente, irá en AWS. Para parar:

```bash
docker compose -f docker-compose.prod.yml down.
```

---

## FASE 1 — Iniciar AWS Academy Learner Lab

1. Ve a [https://awsacademy.instructure.com/](https://awsacademy.instructure.com/) → entra con la cuenta que te dio tu profesor
2. Abre el curso Learner Lab
3. Pestaña **Modules** → click en **Launch AWS Academy Learner Lab**
4. Aparece el panel del lab con un círculo rojo a la izquierda. Pulsa **Start Lab** (botón arriba)
5. Espera hasta que el círculo pase a verde (1-3 min). Si pone amarillo, sigue cargando
6. Click en el círculo verde → se abre en una pestaña nueva la AWS Console

**Importante sobre el lab:**

- La sesión dura 4 horas. Cuando se acaba, las EC2 se paran (no se borran). Los datos del volumen EBS persisten
- El presupuesto es ~$100. Una t3.small 24/7 son ~$15/mes, te sobra mucho
- Región fija: `us-east-1` (N. Virginia). No la cambies

---

## FASE 2 — Crear key pair (par de claves SSH)

En la AWS Console:

1. Buscador arriba → **EC2** → entra
2. Menú izquierdo → **Network & Security** → **Key Pairs**
3. Botón naranja **Create key pair** (arriba dcha)
4. Configura:
   - Name: `gitlearn-key`
   - Key pair type: `RSA`
   - Private key file format: `.pem` (si vas a usar OpenSSH/PowerShell) — si usas PuTTY elige `.ppk`

5. **Create key pair** → se descarga `gitlearn-key.pem` automáticamente
6. Guárdalo en `C:\Users\Usuario\Desktop\` o donde no lo borres. No se puede volver a descargar — si lo pierdes, borras el keypair y creas otro

En PowerShell, restringe permisos del archivo (necesario para SSH):

```bash
icacls "C:\Users\Usuario\Desktop\gitlearn-key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

---

## FASE 3 — Crear Security Group

1. **EC2** → menú izquierdo → **Network & Security** → **Security Groups**
2. **Create security group**
3. Configura:
   - Name: `gitlearn-sg`
   - Description: `GitLearn HTTP + SSH`
   - VPC: la default (sale ya seleccionada)

4. **Inbound rules** → Add rule tres veces:

| Type  | Protocol | Port range | Source                    | Description           |
| ----- | -------- | ---------- | ------------------------- | --------------------- |
| SSH   | TCP      | 22         | My IP (auto-detectada)    | SSH desde mi PC       |
| HTTP  | TCP      | 80         | Anywhere-IPv4 (0.0.0.0/0) | Web pública           |
| HTTPS | TCP      | 443        | Anywhere-IPv4 (0.0.0.0/0) | Reservado para futuro |

5. **Outbound rules**: déjalo como está (permite todo)
6. **Create security group**

---

## FASE 4 — Lanzar la EC2

1. **EC2** → menú izquierdo → **Instances** → **Launch instances** (botón naranja)
2. Configuración:

| Campo                  | Valor                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Name                   | gitlearn-server                                                                                                               |
| AMI                    | Ubuntu Server 22.04 LTS (HVM), SSD — 64-bit (x86) — la primera de la lista, "Free tier eligible"                              |
| Instance type          | t3.small (2 vCPU, 2 GiB RAM). Si Learner Lab no te lo permite, baja a t2.micro (free tier) — irá lento al build pero funciona |
| Key pair               | gitlearn-key                                                                                                                  |
| Network settings       | Click Edit → Select existing security group → marca `gitlearn-sg`                                                             |
| Configure storage      | 20 GiB gp3 (suficiente para el build de Angular + node_modules + Mongo)                                                       |
| Advanced details → IAM | Déjalo vacío (no necesitas)                                                                                                   |

3. **Launch instance**
4. Vuelve a **Instances** → espera al estado **Running + checks 2/2** (puede tardar 1-2 min)
5. Selecciona la instancia → en la sección de abajo copia **Public IPv4 DNS** (algo tipo `ec2-54-89-12-34.compute-1.amazonaws.com`). Lo vas a usar mucho. Llamémosle `<EC2_DNS>` en el resto de la guía

---

## FASE 5 — Conectar por SSH

En PowerShell desde tu PC:

```bash
ssh -i "C:\Users\Usuario\Desktop\gitlearn-key.pem" ubuntu@<EC2_DNS>
```

La primera vez te pregunta si confías en la huella → escribe `yes`. Si funcionas con **permission denied**: el `chmod/icacls` de la fase 2 no se aplicó correctamente. Re-ejecuta el `icacls`.

A partir de aquí, todos los comandos los ejecutas dentro del SSH (en el shell remoto, prompt `ubuntu@ip-...:~$`).

---

## FASE 6 — Instalar Docker + Compose en la EC2

```bash
# Actualizar paquetes
sudo apt-get update && sudo apt-get upgrade -y

# Dependencias
sudo apt-get install -y ca-certificates curl gnupg git

# Repo oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg]
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee
/etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine + Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Permitir docker sin sudo para el user 'ubuntu'
sudo usermod -aG docker ubuntu

# Aplicar el grupo nuevo (sin tener que reloguearte)
newgrp docker

# Verificar
docker --version
docker compose version
```

Deberías ver **Docker version 26+** y **Docker Compose version v2.x**. Si falla `docker ps`: cierra el SSH (`exit`) y reconecta.

---

## FASE 7 — Clonar el repo + configurar .env

Sigues en SSH a la EC2:

```bash
cd ~
git clone https://github.com/<tu-usuario>/gitlearn.git
# Si es repo privado: usa un Personal Access Token en lugar de password
cd gitlearn
```

Crea `backend/.env` con tus valores reales (cambia `<EC2_DNS>` por el real):

```bash
cat > backend/.env <<'EOF'
PORT=3000
NODE_ENV=production

MONGODB_URI=mongodb://mongo:27017/gitlearn

JWT_SECRET=cambia_esto_por_64_caracteres_aleatorios_aqui_xxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_EXPIRY=24h

GITHUB_CLIENT_ID=PENDIENTE_FASE_8
GITHUB_CLIENT_SECRET=PENDIENTE_FASE_8
GITHUB_CALLBACK_URL=http://<EC2_DNS>/api/auth/github/callback

FRONTEND_URL=http://<EC2_DNS>
EOF
```

Genera un `JWT_SECRET` aleatorio fuerte:

```bash
openssl rand -hex 32
```

Pega el output en `JWT_SECRET=` (edita con `nano backend/.env`).

---

## FASE 8 — GitHub OAuth para producción

No reutilices las credenciales del OAuth App local — registra una nueva específica para AWS:

1. [https://github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. Configura:
   - Application name: GitLearn (AWS)
   - Homepage URL: http://<EC2_DNS>
   - Authorization callback URL: http://<EC2_DNS>/api/auth/github/callback ← exacto, sin barra final

3. **Register application** → copia **Client ID**, genera y copia **Client secret**
4. En tu SSH a la EC2, edita el `.env`:

```bash
nano backend/.env
```

Sustituye `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` por los valores reales. `Ctrl+O enter`, `Ctrl+X`.

---

## FASE 9 — Build y arranque

Sigues en SSH:

```bash
cd ~/gitlearn
docker compose -f docker-compose.prod.yml up -d --build
```

El build tarda 5-10 min la primera vez (Angular es lento). Verás output de cada stage. Cuando acabe:

```bash
docker compose -f docker-compose.prod.yml ps
```

Los 3 contenedores (`gitlearn-mongo`, `gitlearn-backend`, `gitlearn-frontend`) deben estar **Up**. Si alguno está en **Restarting** o **Exited**:

```bash
docker logs gitlearn-backend --tail 50
docker logs gitlearn-frontend --tail 50
docker logs gitlearn-mongo --tail 50
```

Healthcheck rápido desde la EC2:

```bash
curl http://localhost/api/health
```

Debería devolver algo tipo `{"status":"ok"}` o similar

---

## FASE 10 — Sembrar BD + crear admin

### 1. Sembrar lecciones e insignias (necesita un profesor en BD para ser autor)

Si no existe ninguno, regístrate primero por la web (ver Fase 11) y luego corre seed con el flag adecuado

```bash
docker exec gitlearn-backend node dist/seed.js
```

Promocionar tu user a admin (si lo necesitas para gestionar usuarios):
Reemplaza por **TU email**

```bash
docker exec gitlearn-mongo mongosh gitlearn --quiet --eval '
db.usuarios.updateOne(
  { email: "tuemail@example.com" },
  { $set: { rol: "administrador" } }
)
'
```

---

## FASE 11 — Verificar y probar

Desde tu PC, abre el navegador en:

```bash
http://<EC2_DNS>
```

Deberías ver la landing de GitLearn. Pruebas:

1. Registrarte vía email → comprobar que cae en la BD (`docker exec gitlearn-mongo mongosh gitlearn --eval 'db.usuarios.find()'`)
2. Login con GitHub → debe redirigir a github.com, autorizar, volver a `/auth/github/callback?token=...` y dejarte logueado
3. Completar una lección → comprobar que XP y aciertos se guardan
4. Insignias en `/app/progreso` deben verse en sus colores

Si algo va mal:

- `docker compose -f docker-compose.prod.yml logs -f backend` → mira errores
- ¿GitHub OAuth callback URL no coincide? Edita la OAuth App en GitHub
- ¿CORS error en el browser? Verifica `FRONTEND_URL` en `.env` apunta al `<EC2_DNS>` correcto y reinicia:

```bash
docker compose -f docker-compose
```
