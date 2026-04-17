import { SendToSpamParams } from '../../../types/Planning';

export class SpamFormBuilder {
  private formData: URLSearchParams;
  private params: SendToSpamParams;

  constructor(params: SendToSpamParams) {
    this.params = params;
    this.formData = new URLSearchParams();
  }

  private addBaseParams(): this {
    const { shopId, usernameReg } = this.params;

    this.formData.append('par[src][shop]', '1');
    this.formData.append('par[src][auction]', '1');
    this.formData.append('par[src][jour]', '0');
    this.formData.append('par[jour_topic_id][]', '0');
    this.formData.append('par[username]', '');
    this.formData.append('par[username_reg]', usernameReg);
    this.formData.append('par[address_source][All]', '1');
    this.formData.append('par[address_source][System]', '1');
    this.formData.append('par[source_seller_w]', '');
    this.formData.append('par[article_id]', '');
    this.formData.append('par[sa]', '');
    this.formData.append('par[sa_old]', '0');
    this.formData.append('par[country_shipping]', '');
    this.formData.append('par[country_invoice]', '');
    this.formData.append('par[reseller]', '0');
    this.formData.append('par[no_sent]', '');
    this.formData.append('par[get_newsmail]', '0');
    this.formData.append('par[newsmail]', '3826');
    this.formData.append('par[unread_sign]', '0');
    this.formData.append('par[unread]', '0');
    this.formData.append('par[notsent]', '-1');
    this.formData.append('par[notsent_days]', '30');
    this.formData.append('par[unshipped]', '');
    this.formData.append('par[customer_type_ex]', '-1');
    this.formData.append('par[customer_type][]', '7');
    this.formData.append('par[customer_type_times]', '0');
    this.formData.append('par[items_per_page]', '20000');
    this.formData.append('par[shop_subscribed_do]', '1');
    this.formData.append('par[shop_subscribed]', shopId.toString());
    this.formData.append('par[sms_and_email]', '');
    this.formData.append('par[sms_shop_subscribed_do]', '');
    this.formData.append('par[sms_shop_subscribed]', shopId.toString());
    this.formData.append('par[is_mobile_phone]', '0');
    this.formData.append('par[phone_type]', 'billing');
    this.formData.append('par[ss_shop_id]', shopId.toString());
    this.formData.append('par[ssm_shop_id]', '');
    this.formData.append('par[is_not_opened_newsletter_checked]', '0');
    this.formData.append('par[not_opened_newsletter_days]', '');
    this.formData.append('par[is_not_visited_shop_checked]', '0');
    this.formData.append('par[not_visited_shop_days]', '');
    this.formData.append('par[resend_type]', 'html');
    this.formData.append('par[shop_id]', shopId.toString());

    return this;
  }

  private addLangParams(): this {
    const { newsletterSlug } = this.params;

    if (newsletterSlug === 'BENL' || newsletterSlug === 'CHDE') {
      this.formData.append('par[lang]', 'french');
      this.formData.append('par[lang_does]', '-1');
    } else if (newsletterSlug === 'BEFR' || newsletterSlug === 'CHFR') {
      this.formData.append('par[lang]', 'french');
      this.formData.append('par[lang_does]', '1');
    } else {
      this.formData.append('par[lang]', '');
      this.formData.append('par[lang_does]', '0');
    }
    return this;
  }

  private addAbTestConfig(): this {
    const { newsletterIds, isABTest } = this.params;

    this.formData.append('par[resend]', newsletterIds[0].toString());

    if (isABTest && newsletterIds[1]) {
      this.formData.append('par[resend2]', newsletterIds[1].toString());
      this.formData.append('par[resend_ab_test]', '1');
    } else {
      this.formData.append('par[resend2]', '');
      this.formData.append('par[resend_ab_test]', '0');
    }

    this.formData.append('show_table', 'false');

    return this;
  }

  build(): URLSearchParams {
    return this.addBaseParams().addLangParams().addAbTestConfig().formData;
  }
}
