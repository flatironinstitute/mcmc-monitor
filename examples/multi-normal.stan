data {
  real<lower = -1, upper = 1> rho;
  int<lower = 0> N;
}  
transformed data {
  vector[N] mu = rep_vector(0, N);
  cov_matrix[N] Sigma;
  for (m in 1:N)
    for (n in 1:N)
      Sigma[m, n] = rho^fabs(m - n);
}
parameters {
  vector[N] y;
}
model {
  y ~ multi_normal(mu, Sigma);
}