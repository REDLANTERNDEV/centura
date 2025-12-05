# Centura CRM'e Katkıda Bulunma

Katkılarınızı bekliyoruz! Centura CRM'e katkıda bulunmayı mümkün olduğunca kolay ve şeffaf hale getirmek istiyoruz:

- Hata bildirimi
- Mevcut kodun tartışılması
- Düzeltme gönderme
- Yeni özellik önerme
- Bakımcı olma

## Geliştirme Süreci

Kodu barındırmak, sorunları ve özellik taleplerini izlemek ve pull request'leri kabul etmek için GitHub kullanıyoruz.

1. Repo'yu fork edin ve `main` dalından kendi dalınızı oluşturun.
2. Test edilmesi gereken kod eklediyseniz, testler ekleyin.
3. API'leri değiştirdiyseniz, dokümantasyonu güncelleyin.
4. Test paketinin geçtiğinden emin olun.
5. Kodunuzun lint kontrolünden geçtiğinden emin olun.
6. Pull request gönderin!

## Pull Request Süreci

1. Arayüz değişikliklerinin ayrıntılarıyla README.md'yi güncelleyin (yeni ortam değişkenleri, açık portlar, dosya konumları ve container parametreleri dahil).
2. Değişikliklerinizle ilgili notlarla CHANGELOG.md'yi güncelleyin.
3. Bakımcıların onayını aldıktan sonra PR birleştirilecektir.

## Kodlama Kuralları

Kodumuzu okumaya başlayın ve alışacaksınız. Okunabilirlik için optimize ediyoruz:

- Tip güvenliği için **TypeScript** kullanıyoruz
- Kod formatlama için **ESLint** ve **Prettier** kullanıyoruz
- Dosya adları için **kebab-case** kullanıyoruz
- Değişkenler ve fonksiyonlar için **camelCase** kullanıyoruz
- Sınıflar ve bileşenler için **PascalCase** kullanıyoruz
- **2 boşluk** ile girinti yapıyoruz (soft tabs)
- Commit mesajları için [Conventional Commits](https://www.conventionalcommits.org/) takip ediyoruz

### Commit Mesajı Formatı

```
<tip>(<kapsam>): <konu>

<gövde>

<altbilgi>
```

**Tipler:**

- `feat`: Yeni bir özellik
- `fix`: Hata düzeltmesi
- `docs`: Sadece dokümantasyon değişiklikleri
- `style`: Kodun anlamını etkilemeyen değişiklikler
- `refactor`: Hata düzeltmeyen veya özellik eklemeyen kod değişikliği
- `perf`: Performansı artıran kod değişikliği
- `test`: Eksik testlerin eklenmesi veya mevcut testlerin düzeltilmesi
- `chore`: Build süreci veya yardımcı araçlardaki değişiklikler

**Örnek:**

```
feat(analytics): müşteri segmentasyon analizi eklendi

Müşteri segmentasyonu için RFM (Recency, Frequency, Monetary) analizi uygulandı.
Yeni API endpoint'leri ve frontend görselleştirmeleri içerir.

Closes #123
```

## Hata Raporları

Hataları izlemek için GitHub issues kullanıyoruz. [Yeni bir issue açarak](https://github.com/REDLANTERNDEV/centura/issues/new) hata bildirin.

**İyi Hata Raporları** genellikle şunları içerir:

- Kısa bir özet ve/veya arka plan
- Yeniden oluşturma adımları
  - Spesifik olun!
  - Mümkünse örnek kod verin
- Ne olmasını beklediğiniz
- Gerçekte ne olduğu
- Notlar (bunun neden olabileceğini düşündüğünüz veya deneyip işe yaramayan şeyler dahil)

## Özellik İstekleri

Özellik taleplerini izlemek için GitHub issues kullanıyoruz. "feature request" etiketi ile [yeni bir issue açarak](https://github.com/REDLANTERNDEV/centura/issues/new) özellik önerin.

**İyi Özellik İstekleri** genellikle şunları içerir:

- Çözmeye çalıştığınız sorunun net ve öz bir açıklaması
- İstediğiniz çözümün açıklaması
- Değerlendirdiğiniz alternatif çözümler
- Ek bağlam veya ekran görüntüleri

## Lisans

Katkıda bulunarak, katkılarınızın MIT Lisansı altında lisanslanacağını kabul etmiş olursunuz.

## Sorularınız mı var?

"question" etiketi ile bir issue açarak soru sormaktan çekinmeyin.

---

Centura CRM'e katkıda bulunduğunuz için teşekkürler! 🎉
